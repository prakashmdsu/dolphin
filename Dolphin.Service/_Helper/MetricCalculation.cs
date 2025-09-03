using Dolphin.Services.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Dolphin.Services.Helper
{
    public class MetricCalculation
    {

        // Helper method to calculate derived fields
        public GraniteStockBlock CalculateDerivedFieldsForBlock(GraniteStockBlock block)
        {
            var lg = block.Measurement?.Lg ?? 0;
            var wd = block.Measurement?.Wd ?? 0;
            var ht = block.Measurement?.Ht ?? 0;

            var quarryCbm = Math.Round((lg * wd * ht) / 1000000.0, 4); // m³
            var dmgTonnage = Math.Round(quarryCbm * 2.85, 4); // example factor
            var netCbm = Math.Round(dmgTonnage / 6.5, 4); // example factor

            block.QuarryCbm = quarryCbm;
            block.DmgTonnage = dmgTonnage;
            block.NetCbm = netCbm;

            return block;
        }

        // Helper method to calculate totals
        public GraniteTotalsDto CalculateTotals(List<GraniteStockBlock> blocks)
        {
            var totalQuarryCbm = blocks.Sum(x => x.QuarryCbm);
            var totalDmgTonnage = blocks.Sum(x => x.DmgTonnage);
            var totalNetCbm = blocks.Sum(x => x.NetCbm);

            return new GraniteTotalsDto
            {
                TotalQuarryCbm = Math.Round(totalQuarryCbm, 4),
                TotalDmgTonnage = Math.Round(totalDmgTonnage, 4),
                TotalNetCbm = Math.Round(totalNetCbm, 4)
            };
        }

        // Helper method to map to DTO
        public GraniteStockBlockDto MapToDto(GraniteStockBlock block)
        {
            return new GraniteStockBlockDto
            {
                Id = block.Id,
                Date = block.Date,
                PitNo = block.PitNo,
                BlockNo = block.BlockNo,
                BuyerBlockNo = block.BuyerBlockNo,
                CategoryGrade = block.CategoryGrade,
                Measurement = block.Measurement,
                 Status = block.Status, 
                UpdatedDate = block.UpdatedDate,
                Note = block.Note,
                EnteredBy = block.EnteredBy,
                QuarryCbm = block.QuarryCbm,
                DmgTonnage = block.DmgTonnage,
                NetCbm = block.NetCbm
            };
        }

    }
}