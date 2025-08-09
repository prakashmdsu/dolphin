public record GraniteBlockStatusDto
{
    public string? Id { get; set; }
    public int BlockNo { get; set; }

public DispatchStatus? Status { get; set; }
    public string GatePassNo { get; set; }
}