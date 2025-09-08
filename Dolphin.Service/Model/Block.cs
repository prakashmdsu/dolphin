// Enhanced Model with calculated properties
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Dolphin.Services.Models
{
    public class GraniteStockBlock
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("dateOfEntry")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)] // Ensure UTC storage
        public DateTime Date { get; set; }

        [BsonElement("pitNo")]
        public int PitNo { get; set; }

        [BsonElement("blockNo")]
        public int BlockNo { get; set; }

        [BsonElement("gatePassNo")]
        public string? GatePassNo { get; set; }

        [BsonElement("buyerBlockNo")]
        public int BuyerBlockNo { get; set; }

        [BsonElement("categoryGrade")]
        public string CategoryGrade { get; set; }

        [BsonElement("measurement")]
        public Measurement Measurement { get; set; }

        // [BsonElement("status")]
        // public int? Status { get; set; }

        [BsonRepresentation(BsonType.Int32)]
        [BsonElement("status")]
        public DispatchStatus? Status { get; set; }

        [BsonElement("updatedDate")]
        public DateTime? UpdatedDate { get; set; }

        [BsonElement("note")]
        public string? Note { get; set; }

        [BsonElement("enteredBy")]
        public string? EnteredBy { get; set; }

        // Calculated properties (not stored in DB)
        // [BsonIgnore]
        public double QuarryCbm { get; set; }

        // [BsonIgnore]
        public double DmgTonnage { get; set; }

        // [BsonIgnore]
        public double NetCbm { get; set; }
        [BsonElement("netweightmt")]
        public double NetWeightMt { get; set; }
        

    }

    public class Measurement
    {
        [BsonElement("lg")]
        public int Lg { get; set; }

        [BsonElement("wd")]
        public int Wd { get; set; }

        [BsonElement("ht")]
        public int Ht { get; set; }
        
    }
}
