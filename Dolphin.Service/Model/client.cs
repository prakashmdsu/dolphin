using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Dolphin.Services.Models
{
    public class Client
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("clientname")]
        public string clientName { get; set; }


        [BsonElement("gstin")]
        public string GSTIN { get; set; }

        [BsonElement("phone")]
        public string Phone { get; set; }

        [BsonElement("country")]
        public string Country { get; set; }

        [BsonElement("address")]
        public string Address { get; set; }

        [BsonElement("clienttype")]
        public string? ClientType { get; set; }
        [BsonElement("pannumber")]
        public string? PanNumber { get; set; }
        [BsonElement("statename")]
        public string? StateName { get; set; }
        [BsonElement("statecode")]
        public int? StateCode { get; set; }

    }
}
