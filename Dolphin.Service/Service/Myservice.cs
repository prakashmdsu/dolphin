using System.Globalization;
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using System.Linq;
using Dolphin.Services.Models;

public class MyService
{
    private readonly IExtendedRepository<GraniteStockBlock> _dolphinRepository;
    private readonly IExtendedRepository<Invoice> _dolphinInvoice;
    private readonly IExtendedRepository<Client> _dolphinClient;
    private readonly IExtendedRepository<GpType> _dolphinGp;
    public MyService(IExtendedRepository<GraniteStockBlock> dolphinRepository,
    IExtendedRepository<Invoice> dolphinInvoice,
      IExtendedRepository<Client> dolphinClient,
        IExtendedRepository<GpType> dolphinGp
)
    {
        _dolphinRepository = dolphinRepository;
        _dolphinInvoice = dolphinInvoice;
        _dolphinClient = dolphinClient;
        _dolphinGp = dolphinGp;
    }

    public async Task<List<GraniteStockBlock>> GetGraniteBlocksByStatusesAsync(List<string?> statuses)
    {
        var collection = _dolphinRepository.GetCollection("granitestockblock") as IMongoCollection<GraniteStockBlock>;

        var filters = new List<FilterDefinition<GraniteStockBlock>>();

        if (statuses.Any(s => string.IsNullOrEmpty(s)))
        {
            filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.Status, null));
        }

        var nonNullStatuses = statuses.Where(s => !string.IsNullOrEmpty(s)).ToList();

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

    // public async Task<List<GraniteStockBlock>> GetGraniteBlocksFilteredAsync(
    //     List<string?> statuses,
    //     int? blockNo,
    //     DateTime startDate,
    //     DateTime endDate,
    //     int pageNumber,
    //     int pageSize)
    // {
    //     var collection = _dolphinRepository.GetCollection("granitestockblock") as IMongoCollection<GraniteStockBlock>;

    //     var filters = new List<FilterDefinition<GraniteStockBlock>>();

    //     // Status filters
    //     if (statuses.Any(s => string.IsNullOrEmpty(s)))
    //     {
    //         filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.Status, null));
    //     }

    //     var nonNullStatuses = statuses.Where(s => !string.IsNullOrEmpty(s)).ToList();
    //     if (nonNullStatuses.Any())
    //     {
    //         filters.Add(Builders<GraniteStockBlock>.Filter.In(s => s.Status, nonNullStatuses));
    //     }

    //     // BlockNo filter
    //     if (blockNo.HasValue)
    //     {
    //         filters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.BlockNo, blockNo.Value));
    //     }

    //     // Date filter (based on DateOfEntry)
    //     filters.Add(Builders<GraniteStockBlock>.Filter.Gte(s => s.Date, startDate));
    //     filters.Add(Builders<GraniteStockBlock>.Filter.Lte(s => s.Date, endDate));

    //     var combinedFilter = filters.Count switch
    //     {
    //         0 => Builders<GraniteStockBlock>.Filter.Empty,
    //         1 => filters[0],
    //         _ => Builders<GraniteStockBlock>.Filter.And(filters)
    //     };

    //     // Apply pagination
    //     return await collection
    //         .Find(combinedFilter)
    //         .Skip((pageNumber - 1) * pageSize)
    //         .Limit(pageSize)
    //         .ToListAsync();
    // }

    public async Task<PaginatedResult<GraniteStockBlock>> GetGraniteBlocksFilteredAsync(
        List<string?> statuses,
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

            // Handle null status (No Status)
            if (statuses.Any(s => s == null))
            {
                statusFilters.Add(Builders<GraniteStockBlock>.Filter.Eq(s => s.Status, null));
            }

            // Handle non-null statuses
            var nonNullStatuses = statuses.Where(s => !string.IsNullOrEmpty(s)).ToList();
            if (nonNullStatuses.Any())
            {
                statusFilters.Add(Builders<GraniteStockBlock>.Filter.In(s => s.Status, nonNullStatuses));
            }

            if (statusFilters.Any())
            {
                filters.Add(statusFilters.Count == 1
                    ? statusFilters[0]
                    : Builders<GraniteStockBlock>.Filter.Or(statusFilters));
            }
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

        // CBM range filters - these would need to be calculated fields or stored separately
        // If you're calculating CBM on the fly, you might need to filter after retrieval
        // For now, assuming you have calculated CBM fields stored
        if (minCbm.HasValue)
        {
            // Assuming you have a calculated field for CBM, adjust field name as needed
            filters.Add(Builders<GraniteStockBlock>.Filter.Gte("quarryCbm", minCbm.Value));
        }

        if (maxCbm.HasValue)
        {
            filters.Add(Builders<GraniteStockBlock>.Filter.Lte("quarryCbm", maxCbm.Value));
        }

        // Combine all filters
        var combinedFilter = filters.Count switch
        {
            0 => Builders<GraniteStockBlock>.Filter.Empty,
            1 => filters[0],
            _ => Builders<GraniteStockBlock>.Filter.And(filters)
        };

        // Get total count
        var totalCount = await collection.CountDocumentsAsync(combinedFilter);

        // Build sort definition
        SortDefinition<GraniteStockBlock> sortDefinition = null;
        if (!string.IsNullOrEmpty(sortBy))
        {
            var isAscending = string.IsNullOrEmpty(sortDirection) ||
                             sortDirection.Equals("asc", StringComparison.OrdinalIgnoreCase);

            sortDefinition = isAscending
                ? Builders<GraniteStockBlock>.Sort.Ascending(sortBy)
                : Builders<GraniteStockBlock>.Sort.Descending(sortBy);
        }
        else
        {
            // Default sort by Date descending (newest first)
            sortDefinition = Builders<GraniteStockBlock>.Sort.Descending(s => s.Date);
        }

        // Apply pagination and sorting
        var query = collection.Find(combinedFilter);

        if (sortDefinition != null)
        {
            query = query.Sort(sortDefinition);
        }

        var data = await query
            .Skip((pageNumber - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return new PaginatedResult<GraniteStockBlock>
        {
            Data = data,
            TotalCount = (int)totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };
    }

    // Alternative method if you need to filter by calculated CBM values
    public async Task<PaginatedResult<GraniteStockBlock>> GetGraniteBlocksFilteredWithCalculatedCbmAsync(
        List<string?> statuses,
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

        // Add all filters except CBM range (same as above method)
        // ... (copy the filter logic from above, excluding CBM filters)

        var combinedFilter = filters.Count switch
        {
            0 => Builders<GraniteStockBlock>.Filter.Empty,
            1 => filters[0],
            _ => Builders<GraniteStockBlock>.Filter.And(filters)
        };

        // If CBM filtering is needed, we'll need to use aggregation pipeline
        if (minCbm.HasValue || maxCbm.HasValue)
        {
            var pipeline = new List<BsonDocument>();

            // Match stage for basic filters
            if (combinedFilter != Builders<GraniteStockBlock>.Filter.Empty)
            {
                var renderedFilter = combinedFilter.Render(
                    new RenderArgs<GraniteStockBlock>(
                        collection.DocumentSerializer,
                        collection.Settings.SerializerRegistry
                    )
                );

                pipeline.Add(new BsonDocument("$match", renderedFilter));
            }
            // Add calculated field for CBM
            pipeline.Add(new BsonDocument("$addFields", new BsonDocument
            {
                ["quarryCbm"] = new BsonDocument("$divide", new BsonArray
            {
                new BsonDocument("$multiply", new BsonArray
                {
                    "$measurement.lg",
                    "$measurement.wd",
                    "$measurement.ht"
                }),
                1000000
            })
            }));

            // Add CBM range filters
            var cbmFilters = new BsonDocument();
            if (minCbm.HasValue)
            {
                cbmFilters["quarryCbm"] = new BsonDocument("$gte", minCbm.Value);
            }
            if (maxCbm.HasValue)
            {
                if (cbmFilters.Contains("quarryCbm"))
                {
                    cbmFilters["quarryCbm"].AsBsonDocument.Add("$lte", maxCbm.Value);
                }
                else
                {
                    cbmFilters["quarryCbm"] = new BsonDocument("$lte", maxCbm.Value);
                }
            }

            if (cbmFilters.ElementCount > 0)
            {
                pipeline.Add(new BsonDocument("$match", cbmFilters));
            }

            // Count total documents
            var countPipeline = new List<BsonDocument>(pipeline)
        {
            new BsonDocument("$count", "total")
        };

            var countResult = await collection.Aggregate<BsonDocument>(countPipeline).FirstOrDefaultAsync();
            var totalCount = countResult?.GetValue("total", 0).ToInt32() ?? 0;

            // Add sorting
            if (!string.IsNullOrEmpty(sortBy))
            {
                var sortOrder = string.IsNullOrEmpty(sortDirection) ||
                                  sortDirection.Equals("asc", StringComparison.OrdinalIgnoreCase) ? 1 : -1;
                pipeline.Add(new BsonDocument("$sort", new BsonDocument(sortBy, sortOrder)));
            }
            else
            {
                pipeline.Add(new BsonDocument("$sort", new BsonDocument("date", -1)));
            }

            // Add pagination
            pipeline.Add(new BsonDocument("$skip", (pageNumber - 1) * pageSize));
            pipeline.Add(new BsonDocument("$limit", pageSize));

            var data = await collection.Aggregate<GraniteStockBlock>(pipeline).ToListAsync();

            return new PaginatedResult<GraniteStockBlock>
            {
                Data = data,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }
        else
        {
            // Use the simpler method when no CBM filtering is needed
            return await GetGraniteBlocksFilteredAsync(statuses, blockNo, startDate, endDate,
                pageNumber, pageSize, pitNo, grade, null, null, sortBy, sortDirection);
        }
    }



    public async Task<GraniteStockBlock> AddStock(GraniteStockBlock stock)
    {
        var collection = (IMongoCollection<GraniteStockBlock>)_dolphinRepository.GetCollection("granitestockblock");
        await collection.InsertOneAsync(stock); // Await the async operation
        return stock; // Return the inserted object
    }

    public async Task<Invoice> AddInvoiceAndUpdateGraniteStocksAsync(Invoice invoice)
    {
        var collectionStock = _dolphinRepository.GetCollection("granitestockblock");
        var collectionInvoice = _dolphinInvoice.GetCollection("invoice");

        // 1. Keep track of successfully updated block numbers
        var updatedBlocks = new List<string>();

        try
        {
            foreach (var stock in invoice.GraniteStocks)
            {
                var updateResult = await collectionStock.UpdateOneAsync(
                    Builders<GraniteStockBlock>.Filter.Eq(s => s.BlockNo, stock.BlockNo),
                    Builders<GraniteStockBlock>.Update.Set(s => s.Status, "billed")
                );

                if (updateResult.ModifiedCount == 1)
                {
                    updatedBlocks.Add((stock.BlockNo).ToString());
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
                    Builders<GraniteStockBlock>.Filter.In(s => (s.BlockNo).ToString(), updatedBlocks),
                    Builders<GraniteStockBlock>.Update.Set(s => s.Status, null)
                );
            }

            // 4. Log and rethrow
            Console.WriteLine($"Error occurred: {ex.Message}");
            throw;
        }

        return invoice;
    }



    public List<Invoice> GetAllInvoice()
    {
        // Fetch the collection dynamically
        var collection = _dolphinInvoice.GetCollection("invoice");
        return collection.Find(FilterDefinition<Invoice>.Empty).ToList(); // Example: Fetch all stocks
    }
    public List<Invoice> GetAllInvoiceById(string id)
    {
        // Fetch the collection dynamically
        var collection = _dolphinInvoice.GetCollection("invoice");
        return collection.Find(FilterDefinition<Invoice>.Empty).ToList(); // Example: Fetch all stocks
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

}
