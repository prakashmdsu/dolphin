using Dolphin.Services.Models;
using Finance.Service.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


[ApiController]
[Route("[controller]")]
// [Authorize]
public class DolphinController : ControllerBase
{
    private readonly MyService _myService;

    public DolphinController(MyService myService)
    {
        _myService = myService;
    }

    [HttpGet("bllingprepopulateddata")]
    public async Task<ActionResult<BillingData>> BillingPrepopulatedData()
    {
        var data = new BillingData()
        {
            gpTypes = _myService.GetAllGp(),   // initialize lists to avoid null references
            clients = _myService.GetAllClients(),
            gatePass = await _myService.GetLastGatePassNo(),
            graniteStockBlocks = await _myService.GetGraniteBlocksByStatusesAsync(new List<DispatchStatus?> { DispatchStatus.ReadyForDispatch })


        };
        return Ok(data);
    }


    [HttpGet("getgranitesblockscategory")]
    public async Task<ActionResult<object>> Get(
        string? status,
        int pageNumber = 1,
        int pageSize = 10,
        int? blockNo = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int? pitNo = null,
        string? grade = null,
        decimal? minCbm = null,
        decimal? maxCbm = null,
        string? sortBy = null,
        string? sortDirection = "asc",
        // New advanced search parameters
        bool advancedTick = false,
        int? minLg = null,
        int? minWd = null,
        int? minHt = null,
        string? billedStatus = null) // "billed", "unbilled", or null for both
    {
        // Set default date range to one month if not provided
        DateTime effectiveEndDate;
        DateTime effectiveStartDate;

        if (endDate.HasValue)
        {
            effectiveEndDate = endDate.Value.ToUniversalTime().Date.AddDays(1).AddTicks(-1);
        }
        else
        {
            effectiveEndDate = DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);
        }

        if (startDate.HasValue)
        {
            effectiveStartDate = startDate.Value.ToUniversalTime().Date;
        }
        else
        {
            effectiveStartDate = effectiveEndDate.AddMonths(-1).Date;
        }

        // Validate pagination parameters
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        List<DispatchStatus?> statusList = new List<DispatchStatus?>();

        // Handle billed/unbilled status first
        if (!string.IsNullOrEmpty(billedStatus))
        {
            switch (billedStatus.ToLower())
            {
                case "billed":
                    // Only items with status (any enum value)
                    statusList = new List<DispatchStatus?>
                {
                    DispatchStatus.ReadyForDispatch,
                    DispatchStatus.LoadedOnTruck,
                    DispatchStatus.AtPort,
                    DispatchStatus.Shipped,
                    DispatchStatus.Cancelled
                };
                    break;
                case "unbilled":
                    // Only items with null status
                    statusList = new List<DispatchStatus?> { null };
                    break;
                default:
                    return BadRequest(new { message = "Invalid billedStatus value. Use 'billed', 'unbilled', or omit parameter." });
            }
        }
        else if (string.IsNullOrEmpty(status))
        {
            // Default: include ReadyForDispatch and null (unbilled) statuses
            statusList = new List<DispatchStatus?> { DispatchStatus.ReadyForDispatch, null };
        }
        else if (Enum.TryParse<DispatchStatus>(status, out var parsedStatus))
        {
            statusList = new List<DispatchStatus?> { parsedStatus };
        }
        else
        {
            return BadRequest(new { message = "Invalid status value" });
        }

        // Validate advanced search parameters
        if (advancedTick)
        {
            if (minLg < 0 || minWd < 0 || minHt < 0)
            {
                return BadRequest(new { message = "Measurement values cannot be negative" });
            }
        }

        try
        {
            var result = await _myService.GetGraniteBlocksFilteredWithCalculationsAsync(
                statusList,
                blockNo,
                effectiveStartDate,
                effectiveEndDate,
                pageNumber,
                pageSize,
                pitNo,
                grade,
                minCbm,
                maxCbm,
                sortBy,
                sortDirection,
                advancedTick,
                minLg,
                minWd,
                minHt,
                billedStatus
            );

            if (result?.Data == null || !result.Data.Any())
            {
                return Ok(new GraniteBlocksResponseDto
                {
                    Data = new List<GraniteStockBlockDto>(),
                    TotalCount = 0,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = 0,
                    HasNextPage = false,
                    HasPreviousPage = false,
                    BilledTotals = new GraniteTotalsDto(),
                    UnbilledTotals = new GraniteTotalsDto(),
                    GrandTotals = new GraniteTotalsDto(),
                    SearchCriteria = new SearchCriteriaDto
                    {
                        AdvancedSearch = advancedTick,
                        MinLg = minLg,
                        MinWd = minWd,
                        MinHt = minHt,
                        BilledStatus = billedStatus
                    }
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "An error occurred while processing your request",
                error = ex.Message
            });
        }
    }



    [HttpGet("getgranitesblockscategorybygatepassorblockno")]
    public async Task<ActionResult<object>> GetStockBYGatePassOrBlockNo(int? blockNo = null, string? gatePassNo = null)
    {
        try
        {
            if (blockNo == null && gatePassNo == null)
            {
                return BadRequest(new { message = "BlockNo or GatePassNo is required" });
            }
            var stock = await _myService.GetBlocksByBlockNoAndGatePassNo(blockNo, gatePassNo);
            return Ok(stock);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "An error occurred while fetching the stock",
                error = ex.Message
            });
        }
    }


    [HttpPost("addgranitestocks")]
    public async Task<ActionResult<GraniteStockBlock>> AddStocks([FromBody] GraniteStockBlock stock)
    {
        // Validate the model
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            GraniteStockBlock invoiceResponse = await _myService.AddStock(stock);
            return Ok(invoiceResponse);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "An error occurred while adding the stock",
                error = ex.Message
            });
        }
    }


    [HttpGet("getgraniteblock/{id}")]
    public async Task<IActionResult> GetGraniteBlockById(string id)
    {
        try
        {

            var block = await _myService.GetGraniteBlockByIdAsync(id);

            if (block == null)
            {
                return NotFound(new { message = $"Block with ID {id} not found" });
            }

            return Ok(new { data = block });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while fetching the block", error = ex.Message });
        }
    }
    [HttpPut("updategraniteblock/{id}")]
    public async Task<IActionResult> UpdateGraniteBlock(string id, [FromBody] GraniteStockBlock block)
    {
        try
        {
            Console.WriteLine($"bock details : {block}...");

            if (block == null)
            {
                return BadRequest(new { message = "Block data is required" });
            }

            var updatedBlock = await _myService.UpdateGraniteBlockAsync(id, block);

            if (updatedBlock == null)
            {
                return NotFound(new { message = $"Block with ID {id} not found" });
            }

            return Ok(new
            {
                message = "Block updated successfully",
                data = updatedBlock
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "An error occurred while updating the block",
                error = ex.Message
            });
        }
    }


    [HttpPut("updateblockstatus")]
    public async Task<ActionResult<long>> updateblockstatus([FromBody] IdsandStatus idsandStatus)
    {
        long updatedCount = await _myService.UpdateBlockStatusById(idsandStatus);
        return Ok(updatedCount);
    }

    [HttpPost("invoice")]
    public async Task<ActionResult<Invoice>> CreateInvoice([FromBody] Invoice invoice)
    {
        var graniteStocksData = invoice.GraniteStocks;
        foreach (var granitedta in graniteStocksData)
        {
            Console.WriteLine(granitedta.BlockNo);
        }
        Invoice invoiceResponse = await _myService.AddInvoiceAndUpdateGraniteStocksAsync(invoice);


        return invoiceResponse;
    }



    [HttpGet("getallinvoice")]
    public async Task<ActionResult<IEnumerable<Invoice>>> GetAllInvoice()

    {
        var analysedCollection = _myService.GetAllInvoice();


        if (analysedCollection == null || !analysedCollection.Any())
        {
            return NotFound("No analysed collections found.");
        }

        return Ok(analysedCollection);
    }


    [HttpGet("getallinvoicepaginated")]
    public async Task<ActionResult<InvoiceDto>> GetAllInvoiceSearchPagination(
        int pageNumber = 1,
        int pageSize = 10,
        int? blockNo = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        string? grade = null,
        string? sortBy = null,
        string? sortDirection = "asc")
    {
        try
        {
            // Set default date range to one month if not provided
            DateTime effectiveEndDate = endDate ?? DateTime.UtcNow;
            DateTime effectiveStartDate = startDate ?? effectiveEndDate.AddMonths(-1);

            // Validate pagination parameters
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100; // Limit max page size

            // Check if service is null
            if (_myService == null)
            {
                return StatusCode(500, new
                {
                    Message = "Service is not properly initialized"
                });
            }

            var result = await _myService.GetBilledFilteredWithCalculationsAsync(
                blockNo,
                effectiveStartDate,
                effectiveEndDate,
                pageNumber,
                pageSize,
                grade,
                sortBy,
                sortDirection
            );

            // Always return the result, even if empty
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, new
            {
                Message = "Configuration error",
                Error = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                Message = "Invalid parameters provided",
                Error = ex.Message
            });
        }
        catch (Exception ex)
        {
            // Log the exception here if you have logging configured
            return StatusCode(500, new
            {
                Message = "An error occurred while processing your request",
                Error = ex.Message
            });
        }
    }
    [HttpGet("getinvoicebyid")]
    public async Task<ActionResult<Invoice>> GetInvoiceById(string id)
    {
        var invoices = await _myService.GetInvoiceByIdAsync(id);


        if (invoices == null)
        {
            return NotFound("No analysed collections found.");
        }

        return Ok(invoices);
    }


    // GET all clients
    [HttpGet("getallclients")]
    public ActionResult<List<Client>> GetAllClients()
    {
        var clients = _myService.GetAllClients();
        return Ok(clients);
    }

    // GET client by ID
    [HttpGet("client/{id}")]
    public async Task<ActionResult<Client>> GetClientById(string id)
    {
        try
        {
            var client = await _myService.GetClientByIdAsync(id);
            if (client == null)
            {
                return NotFound(new { message = $"Client with ID {id} not found" });
            }
            return Ok(client);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST add new client
    [HttpPost("addclient")]
    public async Task<ActionResult<Client>> AddClient([FromBody] Client client)
    {
        Client clientResponse = await _myService.AddNewClient(client);
        return Ok(clientResponse);
    }

    // PUT update client
    [HttpPut("client/{id}")]
    public async Task<ActionResult<Client>> UpdateClient(string id, [FromBody] Client client)
    {
        try
        {
            var updatedClient = await _myService.UpdateClientAsync(id, client);
            if (updatedClient == null)
            {
                return NotFound(new { message = $"Client with ID {id} not found" });
            }
            return Ok(updatedClient);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE client
    [HttpDelete("deleteclient/{id}")]
    public async Task<ActionResult> DeleteClient(string id)
    {
        try
        {
            var deleted = await _myService.DeleteClientAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = $"Client with ID {id} not found" });
            }
            return Ok(new { message = "Client deleted successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpPost("addgp")]
    public async Task<ActionResult<GpType>> AddGpType([FromBody] GpType gpType)
    {
        GpType gpResponse = await _myService.AddNewGp(gpType);
        return gpResponse;
    }



}
