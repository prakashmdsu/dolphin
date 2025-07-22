using Dolphin.Services.Models;
using Finance.Service.Repository;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


[ApiController]
[Route("[controller]")]
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
            graniteStockBlocks = await _myService.GetGraniteBlocksByStatusesAsync(new List<string?> { null })

        };
        return Ok(data);
    }
    //if need mutipple status (new List<string> { "billed", "null" });
    // [HttpGet("getgranitesblockscategory")]
    // public async Task<ActionResult<IEnumerable<GraniteStockBlock>>> Get(
    //     string? status,
    //     int pageNumber = 1,
    //     int pageSize = 10,
    //     int? blockNo = null,
    //     DateTime? startDate = null,
    //     DateTime? endDate = null)
    // {
    //     // Set default date range to one month if not provided
    //     DateTime effectiveEndDate = endDate ?? DateTime.UtcNow;
    //     DateTime effectiveStartDate = startDate ?? effectiveEndDate.AddMonths(-1);

    //     var result = await _myService.GetGraniteBlocksFilteredAsync(
    //         new List<string?> { status },
    //         blockNo,
    //         effectiveStartDate,
    //         effectiveEndDate,
    //         pageNumber,
    //         pageSize
    //     );

    //     if (result == null || !result.Any())
    //     {
    //         return NotFound("No granite stock blocks found for the given filters.");
    //     }

    //     return Ok(result);
    // }



    // Enhanced Controller Method
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
        string? sortDirection = "asc")
    {
        // Set default date range to one month if not provided
        DateTime effectiveEndDate = endDate ?? DateTime.UtcNow;
        DateTime effectiveStartDate = startDate ?? effectiveEndDate.AddMonths(-1);

        // Validate pagination parameters
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100; // Limit max page size

        // Prepare status list - by default include both "Billed" and null status
        List<string?> statusList;
        if (string.IsNullOrEmpty(status))
        {
            // Default: include both "Billed" and null (unbilled)
            statusList = new List<string?> { "Billed", null };
        }
        else if (status == "UnBilled")
        {
            statusList = new List<string?> { null };
        }
        else
        {
            // User provided specific status
            statusList = new List<string?> { status };
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
                sortDirection
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
                    GrandTotals = new GraniteTotalsDto()
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

    [HttpPost("addgranitestocks")]
    public async Task<ActionResult<GraniteStockBlock>> AddStocks([FromBody] GraniteStockBlock stock)
    {
        GraniteStockBlock invoiceResponse = await _myService.AddStock(stock);
        return invoiceResponse;
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
    [HttpPost("addclient")]
    public async Task<ActionResult<Client>> AddClient([FromBody] Client client)
    {
        Client clientResponse = await _myService.AddNewClient(client);
        return clientResponse;
    }


    [HttpPost("addgp")]
    public async Task<ActionResult<GpType>> AddGpType([FromBody] GpType gpType)
    {
        GpType gpResponse = await _myService.AddNewGp(gpType);
        return gpResponse;
    }



}
