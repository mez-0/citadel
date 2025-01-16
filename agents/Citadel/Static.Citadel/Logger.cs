using System;

namespace Citadel
{
    internal class Logger
    {
        public enum LogType
        {
            Good,
            Bad,
            Info,
            Exception
        }

        private static void Log(string message, LogType logType, int indent = 0, bool newLine = true)
        {
            string timestamp = DateTime.Now.ToString("o");

            ConsoleColor color = GetColorForLogType(logType);

            ConsoleColor originalColor = Console.ForegroundColor;

            Console.ForegroundColor = color;

            int spaces = indent * 4;

            if (spaces == 0)
            {
                Console.Write($"[ {timestamp} ]");
            }
            else
            {
                Console.Write(new string(' ', spaces));
                Console.Write($"|_");
            }

            Console.ForegroundColor = originalColor;

            if (newLine)
            {
                Console.WriteLine($" {message}");
            }
            else
            {
                Console.Write($" {message}\r");
            }
        }

        private static ConsoleColor GetColorForLogType(LogType logType)
        {
            switch (logType)
            {
                case LogType.Good:
                    return ConsoleColor.Green;

                case LogType.Bad:
                    return ConsoleColor.Red;

                case LogType.Info:
                    return ConsoleColor.Cyan;

                case LogType.Exception:
                    return ConsoleColor.Magenta;

                default:
                    return ConsoleColor.White;
            }
        }

        public static void Good(string message, int indent = 0, bool newLine = true)
        {
            Log(message, LogType.Good, indent, newLine);
        }

        public static void Bad(string message, int indent = 0, bool newLine = true)
        {
            Log(message, LogType.Bad, indent, newLine);
        }

        public static void Info(string message, int indent = 0, bool newLine = true)
        {
            Log(message, LogType.Info, indent, newLine);
        }

        public static void Exception(Exception ex)
        {
            string dashes = new string('-', 80);
            string message = $"{ex.Message}\n{dashes}\nStackTrace:\n{ex.StackTrace}\n{dashes}";
            Log(message, LogType.Exception);
        }
    }
}