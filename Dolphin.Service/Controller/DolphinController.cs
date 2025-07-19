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

        try
        {
            var result = await _myService.GetGraniteBlocksFilteredAsync(
                new List<string?> { status },
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
                return Ok(new
                {
                    data = new List<GraniteStockBlock>(),
                    totalCount = 0,
                    pageNumber = pageNumber,
                    pageSize = pageSize,
                    totalPages = 0
                });
            }

            var totalPages = (int)Math.Ceiling((double)result.TotalCount / pageSize);

            return Ok(new
            {
                data = result.Data,
                totalCount = result.TotalCount,
                pageNumber = pageNumber,
                pageSize = pageSize,
                totalPages = totalPages,
                hasNextPage = pageNumber < totalPages,
                hasPreviousPage = pageNumber > 1
            });
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error occurred while fetching granite blocks");
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
