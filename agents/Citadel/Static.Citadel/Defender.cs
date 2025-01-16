using Citadel;
using Static.Citadel.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;

namespace Static.Citadel
{
    internal class Defender
    {
        public const string DEFENDER_RESULT_NOT_DETECTED = "DEFENDER_RESULT_NOT_DETECTED";
        public const string DEFENDER_RESULT_THREAT_DETECTED = "DEFENDER_RESULT_THREAT_DETECTED";
        public const string DEFENDER_RESULT_ERROR = "DEFENDER_RESULT_ERROR";
        public const string DEFENDER_RESULT_NOT_COMPLETED = "DEFENDER_RESULT_NOT_COMPLETED";
        private const int DEFENDER_TIMEOUT = 60000 * 10;
        private const int THOROUGH_DEFENDER_INCREMENT_SIZE = 8198;
        private const int DEFAULT_DEFENDER_INCREMENT_SIZE = 1024;

        public static DefenderScanModel ScanFileWithDefender(string filePath)
        {
            ProcessStartInfo processStartInfo = new ProcessStartInfo(@"C:\Program Files\Windows Defender\MpCmdRun.exe")
            {
                Arguments = $"-Scan -ScanType 3 -File \"{filePath}\" -DisableRemediation -trace -Level 0x10",
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            Process process = new Process
            {
                StartInfo = processStartInfo
            };
            process.Start();
            process.WaitForExit(DEFENDER_TIMEOUT);
            if (!process.HasExited)
            {
                Logger.Bad("Windows Defender scan timed out.");
                process.Kill();
            }

            string output = process.StandardOutput.ReadToEnd();

            string threatName = string.Empty;

            foreach (string line in output.Split(new[] { Environment.NewLine }, StringSplitOptions.None))
            {
                if (line.Contains("Threat  "))
                {
                    var sig = line.Split(' ');
                    if (sig.Length > 19)
                    {
                        threatName = sig[19];
                        break;
                    }
                }
            }

            string defenderResult = process.ExitCode switch
            {
                0 => DEFENDER_RESULT_NOT_DETECTED,
                2 => DEFENDER_RESULT_THREAT_DETECTED,
                _ => DEFENDER_RESULT_ERROR
            };

            return new DefenderScanModel
            {
                ResultTitle = defenderResult,
                ThreatNames = new List<string> { threatName }
            };
        }

        public static DefenderScanModel GetDefaultDefenderScanResults(byte[] fileBytes)
        {
            DefenderScanModel scanResult = new DefenderScanModel
            {
                ResultTitle = DEFENDER_RESULT_NOT_COMPLETED,
                ThreatNames = new List<string>(),
            };

            string tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString().Split('-')[0]);

            Directory.CreateDirectory(tempDir);

            int chunkCount = fileBytes.Length / DEFAULT_DEFENDER_INCREMENT_SIZE;

            int idx = 0;

            for (int chunkSize = DEFAULT_DEFENDER_INCREMENT_SIZE; chunkSize <= fileBytes.Length; chunkSize += DEFAULT_DEFENDER_INCREMENT_SIZE)
            {
                idx++;

                if (chunkSize > fileBytes.Length)
                {
                    chunkSize = fileBytes.Length;
                }

                byte[] chunk = new byte[chunkSize];

                Array.Copy(fileBytes, 0, chunk, 0, chunkSize);

                Logger.Info($"Scanning chunk: {idx}/{chunkCount}", newLine: false);

                string tempFilePath = Path.Combine(tempDir, $"chunk_{chunkSize}.tmp");

                File.WriteAllBytes(tempFilePath, chunk);

                scanResult = ScanFileWithDefender(tempFilePath);

                File.Delete(tempFilePath);

                if (scanResult.ResultTitle == DEFENDER_RESULT_THREAT_DETECTED)
                {
                    scanResult.ZeroXMaliciousBytes = chunk;
                    scanResult.XYMaliciousBytes = GetXyBytes(chunk, DEFAULT_DEFENDER_INCREMENT_SIZE);
                    break;
                }
            }

            Console.WriteLine();

            Directory.Delete(tempDir, true);

            return scanResult;
        }

        public static DefenderScanModel GetThoroughDefenderScanResults(byte[] fileBytes)
        {
            DefenderScanModel scanResult = new DefenderScanModel
            {
                ResultTitle = DEFENDER_RESULT_NOT_COMPLETED,
                ThreatNames = new List<string>(),
            };

            string tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString().Split('-')[0]);

            Directory.CreateDirectory(tempDir);

            List<Tuple<int, int>> ranges = new List<Tuple<int, int>>();

            List<string> threatNames = new List<string>();

            byte[] lastSeenMaliciousBytes = null;

            bool foundStart = false;
            int startIndex = 0;
            int endIndex = 0;

            for (int chunkSize = THOROUGH_DEFENDER_INCREMENT_SIZE; chunkSize <= fileBytes.Length; chunkSize += THOROUGH_DEFENDER_INCREMENT_SIZE)
            {
                if (chunkSize > fileBytes.Length)
                {
                    chunkSize = fileBytes.Length;
                }

                byte[] chunk = new byte[chunkSize];

                Array.Copy(fileBytes, 0, chunk, 0, chunkSize);

                string tempFilePath = Path.Combine(tempDir, $"chunk_{chunkSize}.tmp");

                File.WriteAllBytes(tempFilePath, chunk);

                scanResult = ScanFileWithDefender(tempFilePath);

                lastSeenMaliciousBytes = chunk;

                if (scanResult.ThreatNames.Count > 0)
                {
                    foreach (string threatName in scanResult.ThreatNames)
                    {
                        if (!threatNames.Contains(threatName))
                        {
                            if (threatName != string.Empty)
                            {
                                threatNames.Add(threatName);
                            }
                        }
                    }
                }

                File.Delete(tempFilePath);

                if (scanResult.ResultTitle == DEFENDER_RESULT_THREAT_DETECTED)
                {
                    foundStart = true;

                    startIndex = chunkSize - THOROUGH_DEFENDER_INCREMENT_SIZE;
                }
                else if (scanResult.ResultTitle == DEFENDER_RESULT_NOT_DETECTED && foundStart == true)
                {
                    endIndex = chunkSize - THOROUGH_DEFENDER_INCREMENT_SIZE;
                }

                if (foundStart == true && endIndex > 0)
                {
                    ranges.Add(new Tuple<int, int>(startIndex, endIndex));
                    Logger.Info($"Found malicious region: ({startIndex}, {endIndex})", indent: 1);
                    startIndex = 0;
                    endIndex = 0;
                    foundStart = false;
                }

                if (ranges.Count > 1)
                {
                    break;
                }
            }

            Directory.Delete(tempDir, true);

            // foreach range, carve out the malicious bytes and base64 encode them
            foreach (Tuple<int, int> range in ranges)
            {
                int start = range.Item1;
                int end = range.Item2;

                byte[] maliciousBytes = new byte[end - start];

                Array.Copy(fileBytes, start, maliciousBytes, 0, end - start);

                string b64 = Convert.ToBase64String(maliciousBytes);

                scanResult.Base64MaliciousRegions.Add(b64);
            }

            scanResult.ThreatNames = threatNames;

            if (ranges.Count > 0)
            {
                scanResult.ResultTitle = DEFENDER_RESULT_THREAT_DETECTED;
            }
            else
            {
                scanResult.ResultTitle = DEFENDER_RESULT_NOT_DETECTED;
            }

            if (scanResult.Base64MaliciousRegions.Count == 0)
            {
                scanResult.ZeroXMaliciousBytes = lastSeenMaliciousBytes;

                scanResult.XYMaliciousBytes = GetXyBytes(lastSeenMaliciousBytes, THOROUGH_DEFENDER_INCREMENT_SIZE);
            }

            return scanResult;
        }

        private static byte[] GetXyBytes(byte[] chunk, int chunkSize)
        {
            // check if the chunk is null
            if(chunk == null)
            {
                return null;
            }

            // the upper bound of the range, e.g: 256
            int upper = Math.Max(0, chunk.Length - chunkSize);

            // add the chunk size / 2 to the upper bound to get a vague idea of anything malicious in front of the chunk
            upper += chunkSize / 2;

            // the lower bound of the range, e.g: 250
            int lower = Math.Max(0, upper - chunkSize);

            // if the upper is 0, we can't extract any bytes
            if (upper == 0)
            {
                return null;
            }

            // now check if the lower - the chunk size / 2 is less than 0, if it is, we need to adjust the lower bound
            if (lower - chunkSize / 2 < 0)
            {
                lower = 0;
            }
            else
            {
                // if it's not, we subtract the chunk size / 2 from the lower bound
                lower -= chunkSize / 2;
            }

            // this makes our upper: 256 + 128 = 384
            // and our lower: 250 - 128 = 122

            // the diference (e.g: 6) will be the xyChunk size
            byte[] xyChunk = new byte[upper - lower];

            // now we need to extract the 6 bytes from 250 to 256
            Array.Copy(chunk, lower, xyChunk, 0, upper - lower);

            return xyChunk;
        }
    }
}