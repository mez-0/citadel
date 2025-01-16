using System;
using System.Runtime.InteropServices;

namespace Static.Citadel
{
    internal class Amsi
    {
        [DllImport("amsi.dll", CharSet = CharSet.Unicode)]
        public static extern int AmsiInitialize(string appName, out IntPtr amsiContext);

        [DllImport("amsi.dll", CharSet = CharSet.Unicode)]
        public static extern int AmsiScanBuffer(IntPtr amsiContext, byte[] buffer, int bufferSize, string contentName, IntPtr amsiSession, out int result);

        [DllImport("amsi.dll")]
        public static extern void AmsiUninitialize(IntPtr amsiContext);

        public enum AMSI_RESULT
        {
            AMSI_RESULT_CLEAN = 0,
            AMSI_RESULT_NOT_DETECTED = 1,
            AMSI_RESULT_BLOCKED_BY_ADMIN_START = 16384,
            AMSI_RESULT_BLOCKED_BY_ADMIN_END = 20479,
            AMSI_RESULT_DETECTED = 32768
        }

        public static string ScanByteArray(byte[] buffer)
        {
            AmsiInitialize("Citadel", out IntPtr amsiContext);

            AmsiScanBuffer(amsiContext, buffer, buffer.Length, "InMemoryScan", IntPtr.Zero, out int result);

            AmsiUninitialize(amsiContext);

            AMSI_RESULT amsiResult = (AMSI_RESULT)result;

            return amsiResult.ToString();
        }
    }
}