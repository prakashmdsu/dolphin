using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Dolphin.Services.Models
{

    public class Invoice
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("billTo")]
        public string BillTo { get; set; }

        [BsonElement("billToAddress")]
        public string BillToAddress { get; set; }

        [BsonElement("country")]
        public string Country { get; set; }

        [BsonElement("dispatchDate")]
        public DateTime DispatchDate { get; set; }

        [BsonElement("gatePassNo")]
        public string GatePassNo { get; set; }

        [BsonElement("gpType")]
        // [BsonRepresentation(BsonType.ObjectId)]
        public string GpType { get; set; }

        [BsonElement("graniteStocks")]
        public List<GraniteStock> GraniteStocks { get; set; }

        [BsonElement("gstin")]
        public string GSTIN { get; set; }

        [BsonElement("notes")]
        public string Notes { get; set; }

        [BsonElement("phone")]
        public string Phone { get; set; }

        [BsonElement("placeOfDispatch")]
        public string PlaceOfDispatch { get; set; }
    }

    public class GraniteStock
    {
        [BsonElement("blockNo")]
        public int BlockNo { get; set; }

        [BsonElement("categoryGrade")]
        public string CategoryGrade { get; set; }

        [BsonElement("dmgTonnage")]
        public double DmgTonnage { get; set; }

        [BsonElement("hsn")]
        public string HSN { get; set; }

        [BsonElement("itemDescription")]
        public string ItemDescription { get; set; }

        [BsonElement("measurement")]
        public Measurement Measurement { get; set; }

        [BsonElement("netCbm")]
        public double NetCBM { get; set; }

        [BsonElement("permitNo")]
        public string PermitNo { get; set; }

        [BsonElement("quarryCbm")]
        public double QuarryCBM { get; set; }

        [BsonElement("uom")]
        public string UOM { get; set; }
    }



}

