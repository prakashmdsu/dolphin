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
        public DateTime Date { get; set; }

        [BsonElement("pitNo")]
        public int PitNo { get; set; }

        [BsonElement("blockNo")]
        public int BlockNo { get; set; }

        [BsonElement("buyerBlockNo")]
        public int BuyerBlockNo { get; set; }

        [BsonElement("categoryGrade")]
        public string CategoryGrade { get; set; }

        [BsonElement("measurement")]
        public Measurement Measurement { get; set; }

        // [BsonElement("quarryCbm")]
        // public double QuarryCbm { get; set; }

        // [BsonElement("dmgTonnage")]
        // public double DmgTonnage { get; set; }

        // [BsonElement("netCbm")]
        // public double NetCbm { get; set; }

        [BsonElement("status")]
        public string? Status { get; set; }

        [BsonElement("updatedDate")]
        public DateTime? UpdatedDate { get; set; }

        [BsonElement("note")]
        public string? Note { get; set; }


        [BsonElement("enteredBy")]
        public string? EnteredBy { get; set; }


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

