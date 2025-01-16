using Citadel;
using Newtonsoft.Json;
using Static.Citadel.Models;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace Static.Citadel
{
    internal class Program
    {
        private static async Task Main(string[] args)
        {
            if (args.Length < 1)
            {
                Logger.Bad("Please provide the server URL as an argument.");
                return;
            }

            string serverUrl = args[0];

            string endpoint = "/tasks/get";

            using (HttpClient client = new HttpClient())
            {
                while (true)
                {
                    try
                    {
                        HttpResponseMessage response = await client.GetAsync(serverUrl + endpoint);

                        response.EnsureSuccessStatusCode();

                        string responseBody = await response.Content.ReadAsStringAsync();

                        List<IncomingTaskModel> tasks = GetTasks(responseBody);

                        if (tasks.Count == 0)
                        {
                            Thread.Sleep(5000);
                            continue;
                        }

                        foreach (IncomingTaskModel task in tasks)
                        {
                            if (String.IsNullOrEmpty(task.FileName))
                            {
                                Logger.Bad($"Task {task.Uuid} has no file name.");
                                continue;
                            }

                            Console.WriteLine();

                            Console.WriteLine(new string('*', 120));

                            if (ProcessTask(task, serverUrl))
                            {
                                Logger.Info($"Task {task.Uuid} processed successfully.");
                            }
                            else
                            {
                                Logger.Bad($"Task {task.Uuid} failed to process.");
                            }
                            Console.WriteLine(new string('*', 120));

                            Console.WriteLine();
                        }
                    }
                    catch (Exception ex)
                    {
                        Logger.Bad($"Failed to get tasks: {ex.Message}");
                    }

                    Thread.Sleep(3000);
                }
            }
        }

        private static List<IncomingTaskModel> GetTasks(string response)
        {
            List<IncomingTaskModel> tasks = new List<IncomingTaskModel>();

            try
            {
                tasks = JsonConvert.DeserializeObject<List<IncomingTaskModel>>(response);
            }
            catch (Exception ex)
            {
                Logger.Bad(ex.Message);
            }

            return tasks;
        }

        private static bool ProcessTask(IncomingTaskModel task, string baseUrl)
        {
            byte[] payload = Http.GetPayloadBytes(task, baseUrl);

            if (payload == null)
            {
                return false;
            }

            Logger.Good($"Got {payload.Length} bytes of payload!");

            DefenderScanModel defenderScan = new DefenderScanModel();

            if (task.EnableThoroughDefender)
            {
                defenderScan = Defender.GetThoroughDefenderScanResults(payload);
                if (defenderScan.ResultTitle == Defender.DEFENDER_RESULT_NOT_DETECTED)
                {
                    defenderScan = Defender.GetDefaultDefenderScanResults(payload);
                }
            }
            else
            {
                defenderScan = Defender.GetDefaultDefenderScanResults(payload);
            }

            Logger.Info($"Threat(s): {string.Join(", ", defenderScan.ThreatNames)}");

            Logger.Info($"Defender result: {defenderScan.ResultTitle}");

            string amsiResult = Amsi.ScanByteArray(payload);

            Logger.Info($"AMSI result: {amsiResult}");

            string zeroXbase64MaliciousBytes = string.Empty;
            string xyBase64MaliciousBytes = string.Empty;

            if (defenderScan.ZeroXMaliciousBytes != null)
            {
                zeroXbase64MaliciousBytes = Convert.ToBase64String(defenderScan.ZeroXMaliciousBytes);
            }

            if (defenderScan.XYMaliciousBytes != null)
            {
                xyBase64MaliciousBytes = Convert.ToBase64String(defenderScan.XYMaliciousBytes);
            }

            OutgoingTaskModel outgoingTask = new OutgoingTaskModel
            {
                Uuid = task.Uuid,
                TaskStatus = TaskStatusEnum.Completed.ToString(),
                TimeSent = task.TimeSent,
                TimeUpdated = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                FileSha256 = task.FileSha256,
                FileName = task.FileName,
                EnableThoroughDefender = task.EnableThoroughDefender,
                AmsiResult = amsiResult,
                DefenderResult = defenderScan.ResultTitle,
                DefenderThreats = defenderScan.ThreatNames,
                ZeroXBase64MaliciousBytes = zeroXbase64MaliciousBytes,
                XYBase64MaliciousBytes = xyBase64MaliciousBytes,
                ListOfMaliciousBytes = defenderScan.Base64MaliciousRegions
            };

            return Http.UpdateTask(outgoingTask, baseUrl);
        }
    }
}