using System.Globalization;
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using System.Linq;
using Dolphin.Services.Models;
using Dolphin.Services.Helper;

public class MyService
{
    private readonly IExtendedRepository<GraniteStockBlock> _dolphinRepository;
    private readonly IExtendedRepository<Invoice> _dolphinInvoice;
    private readonly IExtendedRepository<Client> _dolphinClient;
    private readonly IExtendedRepository<GpType> _dolphinGp;
    private readonly MetricCalculation _metricHelper;
    private readonly IExtendedRepository<User> _userCollection;
    public MyService(IExtendedRepository<GraniteStockBlock> dolphinRepository,
    IExtendedRepository<Invoice> dolphinInvoice,
      IExtendedRepository<Client> dolphinClient,
        IExtendedRepository<GpType> dolphinGp,
        MetricCalculation metricHelper,
         IExtendedRepository<User> userCollection
)
    {
        _dolphinRepository = dolphinRepository;
        _dolphinInvoice = dolphinInvoice;
        _dolphinClient = dolphinClient;
        _dolphinGp = dolphinGp;
        _metricHelper = metricHelper;
        _userCollection = userCollection;
    }

    public async Task<List<GraniteStockBlock>> GetGraniteBlocksByStatusesAsync(List<DispatchStatus?> statuses)
    {
        var collection = _dolphinRepository.GetCollection("granitestockblock") as IMongoCollection<GraniteStockBlock>;

        var filters = new List<FilterDefinition<GraniteStockBlock>>();

        // Handle null statuses
        if (statuses.Any(s => s == null))
        {
            filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.Status, null));
        }

        // Handle non-null statuses
        var nonNullStatuses = statuses.Where(s => s != null).ToList();
        if (nonNullStatuses.Any())
        {
            filters.Add(Builders<GraniteStockBlock>.Filter.In(s => s.Status, nonNullStatuses));
        }

        var combinedFilter = filters.Count switch
        {
            0 => Builders<GraniteStockBlock>.Filter.Empty,
            1 => filters[0],
            _ => Builders<GraniteStockBlock>.Filter.Or(filters)
        };

        return await collection.Find(combinedFilter).ToListAsync();
    }

// Service Method
public async Task<GraniteBlocksResponseDto> GetGraniteBlocksFilteredWithCalculationsAsync(
    List<DispatchStatus?> statuses,
    int? blockNo,
    DateTime startDate,
    DateTime endDate,
    int pageNumber,
    int pageSize,
    int? pitNo = null,
    string? grade = null,
    decimal? minCbm = null,
    decimal? maxCbm = null,
    string? sortBy = null,
    string? sortDirection = "asc")
{
    var collection = _dolphinRepository.GetCollection("granitestockblock") as IMongoCollection<GraniteStockBlock>;

    var filters = new List<FilterDefinition<GraniteStockBlock>>();

    // Status filters
    if (statuses != null && statuses.Any())
    {
        var statusFilters = new List<FilterDefinition<GraniteStockBlock>>();

        // Handle null status (No Status/Unbilled)
        if (statuses.Any(s => s == null))
        {
            statusFilters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.Status, null));
        }

        // Handle non-null statuses (enum values)
        var nonNullStatuses = statuses.Where(s => s.HasValue).Select(s => s.Value).ToList();
        if (nonNullStatuses.Any())
        {
            // For nullable enum fields, we need to create individual equality filters
            var enumStatusFilters = nonNullStatuses.Select(status =>
                Builders<GraniteStockBlock>.Filter.Eq(s => s.Status, status)).ToList();
            
            if (enumStatusFilters.Count == 1)
            {
                statusFilters.Add(enumStatusFilters[0]);
            }
            else
            {
                statusFilters.Add(Builders<GraniteStockBlock>.Filter.Or(enumStatusFilters));
            }
        }

        if (statusFilters.Any())
        {
            filters.Add(statusFilters.Count == 1
                ? statusFilters[0]
                : Builders<GraniteStockBlock>.Filter.Or(statusFilters));
        }
    }
    else
    {
        // Default: include ReadyForDispatch and null status (unbilled)
        var defaultStatusFilter = Builders<GraniteStockBlock>.Filter.Or(
            Builders<GraniteStockBlock>.Filter.Eq(s => s.Status, DispatchStatus.ReadyForDispatch),
            Builders<GraniteStockBlock>.Filter.Eq(s => s.Status, null)
        );
        filters.Add(defaultStatusFilter);
    }

    // BlockNo filter
    if (blockNo.HasValue)
    {
        filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.BlockNo, blockNo.Value));
    }

    // Date filter (based on Date field)
    filters.Add(Builders<GraniteStockBlock>.Filter.Gte(s => s.Date, startDate));
    filters.Add(Builders<GraniteStockBlock>.Filter.Lte(s => s.Date, endDate));

    // PitNo filter
    if (pitNo.HasValue)
    {
        filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.PitNo, pitNo.Value));
    }

    // Grade filter (CategoryGrade)
    if (!string.IsNullOrEmpty(grade))
    {
        filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.CategoryGrade, grade));
    }

    // Combine all filters
    var combinedFilter = filters.Count switch
    {
        0 => Builders<GraniteStockBlock>.Filter.Empty,
        1 => filters[0],
        _ => Builders<GraniteStockBlock>.Filter.And(filters)
    };

    // First, get all data to calculate totals (without pagination)
    var allDataQuery = collection.Find(combinedFilter);
    var allData = await allDataQuery.ToListAsync();

    // Calculate derived fields for all records using injected helper
    var allCalculatedData = allData.Select(_metricHelper.CalculateDerivedFieldsForBlock).ToList();

    // Apply CBM filters after calculation if needed
    if (minCbm.HasValue || maxCbm.HasValue)
    {
        allCalculatedData = allCalculatedData.Where(item =>
        {
            if (minCbm.HasValue && item.QuarryCbm < (double)minCbm.Value) return false;
            if (maxCbm.HasValue && item.QuarryCbm > (double)maxCbm.Value) return false;
            return true;
        }).ToList();
    }

    // Calculate totals for billed and unbilled using injected helper
    var billedItems = allCalculatedData.Where(x => x.Status.HasValue).ToList(); // Items with any status
    var unbilledItems = allCalculatedData.Where(x => !x.Status.HasValue).ToList(); // Items with null status

    var billedTotals = _metricHelper.CalculateTotals(billedItems);
    var unbilledTotals = _metricHelper.CalculateTotals(unbilledItems);
    var grandTotals = _metricHelper.CalculateTotals(allCalculatedData);

    // Apply sorting
    if (!string.IsNullOrEmpty(sortBy))
    {
        var isAscending = string.IsNullOrEmpty(sortDirection) ||
                         sortDirection.Equals("asc", StringComparison.OrdinalIgnoreCase);

        allCalculatedData = sortBy.ToLower() switch
        {
            "quarrycbm" => isAscending
                ? allCalculatedData.OrderBy(x => x.QuarryCbm).ToList()
                : allCalculatedData.OrderByDescending(x => x.QuarryCbm).ToList(),
            "dmgtonnage" => isAscending
                ? allCalculatedData.OrderBy(x => x.DmgTonnage).ToList()
                : allCalculatedData.OrderByDescending(x => x.DmgTonnage).ToList(),
            "netcbm" => isAscending
                ? allCalculatedData.OrderBy(x => x.NetCbm).ToList()
                : allCalculatedData.OrderByDescending(x => x.NetCbm).ToList(),
            "date" => isAscending
                ? allCalculatedData.OrderBy(x => x.Date).ToList()
                : allCalculatedData.OrderByDescending(x => x.Date).ToList(),
            "blockno" => isAscending
                ? allCalculatedData.OrderBy(x => x.BlockNo).ToList()
                : allCalculatedData.OrderByDescending(x => x.BlockNo).ToList(),
            _ => allCalculatedData.OrderByDescending(x => x.Date).ToList()
        };
    }
    else
    {
        // Default sort by Date descending (newest first)
        allCalculatedData = allCalculatedData.OrderByDescending(x => x.Date).ToList();
    }

    // Apply pagination
    var totalCount = allCalculatedData.Count;
    var paginatedData = allCalculatedData
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .ToList();

    var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

    // Convert to DTOs using injected helper
    var dtoData = paginatedData.Select(_metricHelper.MapToDto).ToList();

    return new GraniteBlocksResponseDto
    {
        Data = dtoData,
        TotalCount = totalCount,
        PageNumber = pageNumber,
        PageSize = pageSize,
        TotalPages = totalPages,
        HasNextPage = pageNumber < totalPages,
        HasPreviousPage = pageNumber > 1,
        BilledTotals = billedTotals,
        UnbilledTotals = unbilledTotals,
        GrandTotals = grandTotals
    };
}

    // Enhanced Service Method
    private async Task<List<GraniteStockBlock>> GetGraniteBlocksByStatusesInternalAsync(List<DispatchStatus?> statuses)
    {
        var collection = _dolphinRepository.GetCollection("granitestockblock") as IMongoCollection<GraniteStockBlock>;

        var filters = new List<FilterDefinition<GraniteStockBlock>>();

        // Handle null statuses
        if (statuses.Any(s => s == null))
        {
            filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.Status, null));
        }

        // Handle non-null statuses
        var nonNullStatuses = statuses.Where(s => s != null).ToList();
        if (nonNullStatuses.Any())
        {
            filters.Add(Builders<GraniteStockBlock>.Filter.In(s => s.Status, nonNullStatuses));
        }

        var combinedFilter = filters.Count switch
        {
            0 => Builders<GraniteStockBlock>.Filter.Empty,
            1 => filters[0],
            _ => Builders<GraniteStockBlock>.Filter.Or(filters)
        };

        return await collection.Find(combinedFilter).ToListAsync();
    }

    // Enhanced Service Method
    public async Task<InvoiceDto> GetBilledFilteredWithCalculationsAsync(
        int? blockNo,
        DateTime startDate,
        DateTime endDate,
        int pageNumber,
        int pageSize,
        string? grade = null,
        string? sortBy = null,
        string? sortDirection = "asc")
    {
        try
        {
            // Use the same pattern as your working GetAllInvoice method
            var collection = _dolphinInvoice.GetCollection("invoice");

            var filterBuilder = Builders<Invoice>.Filter;
            var filters = new List<FilterDefinition<Invoice>>();

            // Date filter (based on DispatchDate field)
            // Convert to UTC for comparison since your dates are in UTC
            var utcStartDate = startDate.ToUniversalTime();
            var utcEndDate = endDate.ToUniversalTime();

            filters.Add(filterBuilder.Gte(x => x.DispatchDate, utcStartDate));
            filters.Add(filterBuilder.Lte(x => x.DispatchDate, utcEndDate));

            // Block number filter (search within graniteStocks array)
            if (blockNo.HasValue)
            {
                filters.Add(filterBuilder.ElemMatch(x => x.GraniteStocks,
                    Builders<GraniteStock>.Filter.Eq(gs => gs.BlockNo, blockNo.Value)));
            }

            // Grade filter (search within graniteStocks array)
            if (!string.IsNullOrEmpty(grade))
            {
                filters.Add(filterBuilder.ElemMatch(x => x.GraniteStocks,
                    Builders<GraniteStock>.Filter.Eq(gs => gs.CategoryGrade, grade)));
            }

            // Combine all filters
            var combinedFilter = filters.Count > 0
                ? filterBuilder.And(filters)
                : FilterDefinition<Invoice>.Empty;

            // Build sort definition
            var sortBuilder = Builders<Invoice>.Sort;
            SortDefinition<Invoice> sortDefinition;

            if (!string.IsNullOrEmpty(sortBy))
            {
                var isAscending = sortDirection?.ToLower() != "desc";

                sortDefinition = sortBy.ToLower() switch
                {
                    "dispatchdate" => isAscending
                        ? sortBuilder.Ascending(x => x.DispatchDate)
                        : sortBuilder.Descending(x => x.DispatchDate),
                    "billto" => isAscending
                        ? sortBuilder.Ascending(x => x.BillTo)
                        : sortBuilder.Descending(x => x.BillTo),
                    "country" => isAscending
                        ? sortBuilder.Ascending(x => x.Country)
                        : sortBuilder.Descending(x => x.Country),
                    "gatepassno" => isAscending
                        ? sortBuilder.Ascending(x => x.GatePassNo)
                        : sortBuilder.Descending(x => x.GatePassNo),
                    _ => sortBuilder.Descending(x => x.DispatchDate) // Default sort
                };
            }
            else
            {
                // Default sort by dispatch date descending (most recent first)
                sortDefinition = sortBuilder.Descending(x => x.DispatchDate);
            }

            // Get total count for pagination (use synchronous method like your working example)
            var totalCount = collection.Find(combinedFilter).CountDocuments();

            // Calculate pagination values
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
            var skip = (pageNumber - 1) * pageSize;

            // Execute the query with pagination and sorting (use synchronous methods)
            var invoices = collection
                .Find(combinedFilter)
                .Sort(sortDefinition)
                .Skip(skip)
                .Limit(pageSize)
                .ToList();

            // Calculate pagination flags
            var hasNextPage = pageNumber < totalPages;
            var hasPreviousPage = pageNumber > 1;

            // Return the response DTO
            return new InvoiceDto
            {
                Data = invoices ?? new List<Invoice>(),
                TotalCount = (int)totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasNextPage = hasNextPage,
                HasPreviousPage = hasPreviousPage
            };
        }
        catch (Exception ex)
        {
            // Log the exception for debugging
            Console.WriteLine($"Error in GetBilledFilteredWithCalculationsAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");

            // Return empty result instead of throwing
            return new InvoiceDto
            {
                Data = new List<Invoice>(),
                TotalCount = 0,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = 0,
                HasNextPage = false,
                HasPreviousPage = false
            };
        }
    }



    public async Task<GraniteStockBlock> AddStock(GraniteStockBlock stock)
    {
        var collection = (IMongoCollection<GraniteStockBlock>)_dolphinRepository.GetCollection("granitestockblock");

        // Set the entry date to current UTC time if not provided
        if (stock.Date == default(DateTime))
        {
            stock.Date = DateTime.UtcNow;
        }
        else
        {
            // Ensure the provided date is converted to UTC
            stock.Date = stock.Date.ToUniversalTime();
        }

        // Clear the ID to let MongoDB generate it
        stock.Id = null;

        // Optional: Check for duplicate block numbers
        var existingBlock = await collection.Find(x => x.BlockNo == stock.BlockNo).FirstOrDefaultAsync();
        if (existingBlock != null)
        {
            throw new InvalidOperationException($"Block number {stock.BlockNo} already exists");
        }

        await collection.InsertOneAsync(stock);
        return stock;
    }

public async Task<long> UpdateBlockStatusById(IdsandStatus stock)
{
    var collection = (IMongoCollection<GraniteStockBlock>)_dolphinRepository.GetCollection("granitestockblock");

    var filter = Builders<GraniteStockBlock>.Filter.In(x => x.Id, stock.ids.Id);

    var update = Builders<GraniteStockBlock>.Update
        .Set(x => x.Status, stock.ids.Status)
        .Set(x => x.UpdatedDate, DateTime.UtcNow);

    var result = await collection.UpdateManyAsync(filter, update);

    return result.ModifiedCount;
}




    public async Task<Invoice> AddInvoiceAndUpdateGraniteStocksAsync(Invoice invoice)
    {
        var collectionStock = _dolphinRepository.GetCollection("granitestockblock");
        var collectionInvoice = _dolphinInvoice.GetCollection("invoice");

        // 1. Keep track of successfully updated block numbers
        var updatedBlocks = new List<int>();

        try
        {
            foreach (var stock in invoice.GraniteStocks)
            {
                var updateResult = await collectionStock.UpdateOneAsync(
                    Builders<GraniteStockBlock>.Filter.Eq(s => s.BlockNo, stock.BlockNo),
                    Builders<GraniteStockBlock>.Update.Set(s => s.Status, DispatchStatus.ReadyForDispatch)
                                                      .Set(s => s.GatePassNo, invoice.GatePassNo)


                );

                if (updateResult.ModifiedCount == 1)
                {
                    updatedBlocks.Add(stock.BlockNo);
                }
                else
                {
                    throw new Exception($"Failed to update stock block {stock.BlockNo}");
                }
            }

            // 2. Try inserting the invoice
            await collectionInvoice.InsertOneAsync(invoice);
        }
        catch (Exception ex)
        {
            // 3. Rollback: set status back to "available" for previously updated stocks
            if (updatedBlocks.Count > 0)
            {
                await collectionStock.UpdateManyAsync(
     Builders<GraniteStockBlock>.Filter.In(s => s.BlockNo, updatedBlocks),
     Builders<GraniteStockBlock>.Update.Set(s => s.Status, null)
 );
            }

            // 4. Log and rethrow
            Console.WriteLine($"Error occurred: {ex.Message}");
            throw;
        }

        return invoice;
    }
public async Task<IEnumerable<GraniteBlockStatusDto>> GetBlocksByBlockNoAndGatePassNo(int? blockNo, string? gatePassNo)
{
    var collection = _dolphinRepository.GetCollection("granitestockblock") 
        as IMongoCollection<GraniteStockBlock>;

    var filters = new List<FilterDefinition<GraniteStockBlock>>();

    if (!string.IsNullOrEmpty(gatePassNo))
    {
        filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.GatePassNo, gatePassNo));
    }

    if (blockNo.HasValue)
    {
        filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.BlockNo, blockNo));
    }

    var combinedFilter = filters.Count switch
    {
        0 => Builders<GraniteStockBlock>.Filter.Empty,
        1 => filters[0],
        _ => Builders<GraniteStockBlock>.Filter.Or(filters)
    };

    var blocks = await collection.Find(combinedFilter).ToListAsync();

    // Map entity to DTO
    return blocks.Select(b => new GraniteBlockStatusDto
    {
        Id = b.Id.ToString(),
        BlockNo = b.BlockNo,
        Status = b.Status,
        GatePassNo = b.GatePassNo
    });
}


    public List<Invoice> GetAllInvoice()
    {
        // Fetch the collection dynamically
        var collection = _dolphinInvoice.GetCollection("invoice");
        return collection.Find(FilterDefinition<Invoice>.Empty).ToList(); // Example: Fetch all stocks
    }
    public async Task<Invoice?> GetInvoiceByIdAsync(string id)
    {
        var collection = _dolphinInvoice.GetCollection("invoice");

        if (!ObjectId.TryParse(id, out ObjectId objectId))
        {
            throw new ArgumentException("Invalid ObjectId format", nameof(id));
        }

        var filter = Builders<Invoice>.Filter.Eq(i => i.Id, objectId.ToString());
        return await collection.Find(filter).FirstOrDefaultAsync();
    }


    public async Task<Client> AddNewClient(Client client)
    {
        var collection = (IMongoCollection<Client>)_dolphinClient.GetCollection("client");
        await collection.InsertOneAsync(client); // Await the async operation
        return client; // Return the inserted object
    }

    public List<Client> GetAllClients()
    {
        // Fetch the collection dynamically
        var collection = _dolphinClient.GetCollection("client");
        return collection.Find(FilterDefinition<Client>.Empty).ToList(); // Example: Fetch all stocks
    }
    public async Task<string?> GetLastGatePassNo()
    {
        var collectionInvoice = _dolphinInvoice.GetCollection("invoice");

        var lastInvoice = await collectionInvoice
            .Find(FilterDefinition<Invoice>.Empty)
            .SortByDescending(inv => inv.Id)
            .FirstOrDefaultAsync();

        // Return null if no invoice found or if GatePassNo is null
        return lastInvoice?.GatePassNo;
    }

    public async Task<GpType> AddNewGp(GpType gptype)
    {
        var collection = (IMongoCollection<GpType>)_dolphinGp.GetCollection("gp");
        await collection.InsertOneAsync(gptype); // Await the async operation
        return gptype; // Return the inserted object
    }
    public List<GpType> GetAllGp()
    {
        // Fetch the collection dynamically
        var collection = _dolphinGp.GetCollection("gp");
        return collection.Find(FilterDefinition<GpType>.Empty).ToList(); // Example: Fetch all stocks
    }

    //For all user related 
    public async Task<string> AddUser(string collectionName, User userdata)
    {
        var collection = _userCollection.GetCollection(collectionName);

        // Check if user already exists
        var existingUser = await collection.Find(u => u.Email == userdata.Email)
                                         .FirstOrDefaultAsync();
        if (existingUser != null)
        {
            return "UserExist";
        }

        // Hash the provided password, not a generated one
        userdata.PasswordHash = PasswordHelper.HashPassword(userdata.PasswordHash); // Assuming Password is the plain text password

        var newUser = new User
        {
            UserName = userdata.UserName,
            Email = userdata.Email,
            Role = userdata.Role,
            PhoneNumber = userdata.PhoneNumber,
            PasswordHash = userdata.PasswordHash
        };

        await collection.InsertOneAsync(newUser);
        return newUser.userId.ToString();
    }
    public async Task<List<User>> GetAllUser(string collectionName)
    {
        var collection = _userCollection.GetCollection(collectionName);
        return await collection.Find(FilterDefinition<User>.Empty).ToListAsync();
    }
    public async Task<User> GetLoginUser(string collectionName, LoginRequest request)
    {
        var collection = _userCollection.GetCollection(collectionName);
        return await collection.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
    }
    public async Task<User> GetUserProfile(string collectionName, string email)
    {
        var collection = _userCollection.GetCollection(collectionName);
        return await collection.Find(u => u.Email == email).FirstOrDefaultAsync();
    }
    public async Task<string> UpadatePassword(string collectionName, User profile)
    {

        var collection = _userCollection.GetCollection(collectionName);
        string tempPassword = GenerateTempPassword();
        var filter = Builders<User>.Filter.Eq(p => p.Email, profile.Email);
        var hashedPassword = PasswordHelper.HashPassword(tempPassword);
        var updateProfile = Builders<User>.Update
            .Set(p => p.PasswordHash, hashedPassword);


        // Execute the update
        var updateResult = await collection.UpdateOneAsync(filter, updateProfile);

        // Check if the update was successful
        if (updateResult.ModifiedCount == 0)
        {
            throw new Exception("User not found or password update failed.");
        }

        // Return the generated temporary password
        return tempPassword;
    }
    // Helper method to generate a secure temporary password
    private string GenerateTempPassword()
    {
        const int length = 12;
        const string validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        var random = new Random();
        return new string(Enumerable.Repeat(validChars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
    public async Task<List<string>> GetAdminEmails()
    {
        // Access the MongoDB collection
        var collection = _userCollection.GetCollection("UserCollections");

        // Query for users with the role "admin" and project only the Email field
        var emails = await collection
            .Find(u => u.Role == "Admin")
            .Project(u => u.Email)
            .ToListAsync();

        return emails;
    }
     public async Task<List<GraniteStockBlock>> GetGraniteBlocksByStatusesAsync(List<string?> statusStrings)
{
    var statusEnums = new List<DispatchStatus?>();
    
    foreach (var statusString in statusStrings)
    {
        if (string.IsNullOrEmpty(statusString))
        {
            statusEnums.Add(null);
        }
        else if (Enum.TryParse<DispatchStatus>(statusString, true, out var parsedStatus))
        {
            statusEnums.Add(parsedStatus);
        }
        // Optionally handle legacy string values that don't match enum names
        else
        {
            // Map legacy string values to enum if needed
            statusEnums.Add(MapLegacyStringToEnum(statusString));
        }
    }
    
    return await GetGraniteBlocksByStatusesAsync(statusEnums);
}
private DispatchStatus? MapLegacyStringToEnum(string statusString)
{
    return statusString?.ToLower() switch
    {
        "readyfordispatch" => DispatchStatus.ReadyForDispatch,
        "loadedontruck" => DispatchStatus.LoadedOnTruck,
        "atport" => DispatchStatus.AtPort,
        "shipped" => DispatchStatus.Shipped,
        "cancelled" => DispatchStatus.Cancelled,
        "billed" => null, // If "Billed" was a legacy status that doesn't exist in enum
        _ => null
    };
}

}
