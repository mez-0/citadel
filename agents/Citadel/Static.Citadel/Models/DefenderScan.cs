using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;

namespace Static.Citadel.Models
{
    public class DefenderScanModel
    {
        [JsonProperty("result_code")]
        public string ResultTitle { get; set; }

        [JsonProperty("threat_names")]
        public List<String> ThreatNames { get; set; }

        [JsonProperty("zero_x_malicious_bytes")]
        public byte[] ZeroXMaliciousBytes { get; set; }

        [JsonProperty("x_y_malicious_bytes")]
        public byte[] XYMaliciousBytes { get; set; }

        [JsonProperty("malicious_regions")]
        public List<string> Base64MaliciousRegions { get; set; }

        public DefenderScanModel()
        {
            ResultTitle = string.Empty;
            ThreatNames = new List<string>();
            ZeroXMaliciousBytes = null;
            XYMaliciousBytes = null;
            Base64MaliciousRegions = new List<string>();
        }

        public override string ToString()
        {
            return $"ResultTitle: {ResultTitle}, ThreatNames: {string.Join(", ", ThreatNames)}";
        }
    }
}