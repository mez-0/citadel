using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace Static.Citadel.Models
{
    public enum TaskStatusEnum
    {
        Pending = 1,
        InProgress = 2,
        Completed = 3,
        Failed = 4
    }

    public class IncomingTaskModel
    {
        [JsonProperty("uuid")]
        public string Uuid { get; set; }

        [JsonProperty("task_status")]
        public string TaskStatus { get; set; }

        [JsonProperty("time_sent")]
        public long TimeSent { get; set; }

        [JsonProperty("time_updated")]
        public long TimeUpdated { get; set; }

        [JsonProperty("file_sha256")]
        public string FileSha256 { get; set; }

        [JsonProperty("file_name")]
        public string FileName { get; set; }

        [JsonProperty("enable_static_analysis")]
        public bool EnableStaticAnalysis { get; set; }

        [JsonProperty("enable_dynamic_analysis")]
        public bool EnableDynamicAnalysis { get; set; }

        [JsonProperty("enable_thorough_defender")]
        public bool EnableThoroughDefender { get; set; }

        public IncomingTaskModel()
        {
            Uuid = string.Empty;
            TaskStatus = TaskStatusEnum.Pending.ToString();
            TimeSent = 0;
            TimeUpdated = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            FileSha256 = string.Empty;
            FileName = string.Empty;
            EnableStaticAnalysis = true;
            EnableDynamicAnalysis = false;
            EnableThoroughDefender = false;
        }

        public override string ToString()
        {
            return $"Uuid: {Uuid}, TaskStatus: {TaskStatus}, TimeSent: {TimeSent}, TimeUpdated: {TimeUpdated}, FileSha256: {FileSha256}, FileName: {FileName}, EnableStaticAnalysis: {EnableStaticAnalysis}, EnableDynamicAnalysis: {EnableDynamicAnalysis}";
        }
    }

    public class OutgoingTaskModel
    {
        [JsonProperty("uuid")]
        public string Uuid { get; set; }

        [JsonProperty("task_status")]
        public string TaskStatus { get; set; }

        [JsonProperty("time_sent")]
        public long TimeSent { get; set; }

        [JsonProperty("time_updated")]
        public long TimeUpdated { get; set; }

        [JsonProperty("file_sha256")]
        public string FileSha256 { get; set; }

        [JsonProperty("file_name")]
        public string FileName { get; set; }

        [JsonProperty("enable_thorough_defender")]
        public bool EnableThoroughDefender { get; set; }

        [JsonProperty("amsi_result")]
        public string AmsiResult { get; set; }

        [JsonProperty("defender_result")]
        public string DefenderResult { get; set; }

        [JsonProperty("defender_threats")]
        public List<string> DefenderThreats { get; set; }

        [JsonProperty("0_x_base64_malicious_bytes")]
        public string ZeroXBase64MaliciousBytes { get; set; }

        [JsonProperty("x_y_base64_malicious_bytes")]
        public string XYBase64MaliciousBytes { get; set; }

        [JsonProperty("list_of_base64_malicious_bytes")]
        public List<string> ListOfMaliciousBytes { get; set; }

        public OutgoingTaskModel()
        {
            Uuid = string.Empty;
            TaskStatus = TaskStatusEnum.Pending.ToString();
            TimeSent = 0;
            TimeUpdated = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            FileSha256 = string.Empty;
            FileName = string.Empty;
            AmsiResult = string.Empty;
            DefenderResult = string.Empty;
            DefenderThreats = new List<string>();
            ZeroXBase64MaliciousBytes = string.Empty;
            XYBase64MaliciousBytes = string.Empty;
            ListOfMaliciousBytes = new List<string>();
        }

        public override string ToString()
        {
            return $"Uuid: {Uuid}, TaskStatus: {TaskStatus}, TimeSent: {TimeSent}, TimeUpdated: {TimeUpdated}, FileSha256: {FileSha256}, FileName: {FileName}, AmsiResult: {AmsiResult}, DefenderResult: {DefenderResult}";
        }
    }
}