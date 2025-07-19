using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Dolphin.Services.Models
{
    public class BillingData
    {
        public List<GpType> gpTypes { get; set; }
        public List<Client> clients { get; set; }
        public List<GraniteStockBlock> graniteStockBlocks { get; set; }

    }
}