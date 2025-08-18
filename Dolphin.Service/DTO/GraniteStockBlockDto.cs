
// DTO for response
using Dolphin.Services.Models;

public class GraniteStockBlockDto
{
    public string? Id { get; set; }
    public DateTime Date { get; set; }
    public int PitNo { get; set; }
    public int BlockNo { get; set; }
    public int BuyerBlockNo { get; set; }
    public string CategoryGrade { get; set; }
    public Measurement Measurement { get; set; }
    public string? Status { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public string? Note { get; set; }
    public string? EnteredBy { get; set; }

    // Calculated fields
    public double QuarryCbm { get; set; }
    public double DmgTonnage { get; set; }
    public double NetCbm { get; set; }
}

public class GraniteTotalsDto
{
    public double TotalQuarryCbm { get; set; }
    public double TotalDmgTonnage { get; set; }
    public double TotalNetCbm { get; set; }
}

public class GraniteBlocksResponseDto
{
    public List<GraniteStockBlockDto> Data { get; set; }
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }

    // Separate totals for billed and unbilled
    public GraniteTotalsDto BilledTotals { get; set; }
    public GraniteTotalsDto UnbilledTotals { get; set; }
    public GraniteTotalsDto GrandTotals { get; set; }
}
