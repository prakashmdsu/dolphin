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

        [BsonElement("transportercontactNo")]
        public string TansporterContactNo { get; set; }

        [BsonElement("vehicleNo")]
        public string VehicleNo { get; set; }
        [BsonElement("driverName")]
        public string DriverName { get; set; }
        [BsonElement("driverContactNo")]
        public string DriverContactNo { get; set; }
        [BsonElement("ewaybillno")]
        public string EwayBillNo { get; set; }
        [BsonElement("buyersordernumber")]
        public string BuyersOrderNumber { get; set; }

        [BsonElement("supplierref")]
        public string SupplierRef { get; set; }
        [BsonElement("otherreference")]
        public string OtherReference { get; set; }
        [BsonElement("dispatchedthrough")]
        public string DispatchedThrough { get; set; }
        [BsonElement("destination")]
        public string Destination { get; set; }
        [BsonElement("termsofpayment")]
        public string TermsOfPayment { get; set; }
        [BsonElement("otherrefence")]
        public string otherrefence { get; set; }
        [BsonElement("deliverynotedate")]
        public string DeliveryNoteDate { get; set; }
        [BsonElement("hsn")]
        public string HSN { get; set; }
        [BsonElement("permitNo")]
        public string PermitNo { get; set; }

    }

    public class GraniteStock
    {
        [BsonElement("blockNo")]
        public int BlockNo { get; set; }

        [BsonElement("categoryGrade")]
        public string CategoryGrade { get; set; }

        [BsonElement("dmgTonnage")]
        public double DmgTonnage { get; set; }



        [BsonElement("itemDescription")]
        public string ItemDescription { get; set; }

        [BsonElement("measurement")]
        public Measurement Measurement { get; set; }

        [BsonElement("netCbm")]
        public double NetCBM { get; set; }



        [BsonElement("quarryCbm")]
        public double QuarryCBM { get; set; }

        [BsonElement("netweightmt")]
        public double NetWeightMt { get; set; }

        [BsonElement("uom")]
        public string UOM { get; set; }
    }



}

