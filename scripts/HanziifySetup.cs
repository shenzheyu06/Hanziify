using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;

internal static class HanziifySetup
{
    private const string Extension = "hanziify.js";

    private static int Main()
    {
        try
        {
            Install();
            Console.WriteLine("Hanziify is installed. Open Spotify if it hasn't opened already.");
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("Setup couldn't finish: " + error.Message);
            return 1;
        }
        finally
        {
            if (!Console.IsInputRedirected)
            {
                Console.WriteLine("Press Enter to close.");
                Console.ReadLine();
            }
        }
    }

    private static void Install()
    {
        string spicetify = FindSpicetify();
        if (spicetify == null)
        {
            string winget = FindOnPath("winget.exe", Environment.GetEnvironmentVariable("PATH"))
                ?? ExistingFile(Path.Combine(LocalData, "Microsoft", "WindowsApps", "winget.exe"));
            if (winget == null)
                throw new InvalidOperationException("Install or update App Installer from the Microsoft Store to get WinGet, then run setup again.");

            Console.WriteLine("Installing Spicetify through WinGet...");
            Run(winget, "install --id Spicetify.Spicetify --exact --source winget");
            spicetify = FindSpicetify();
            if (spicetify == null)
                throw new InvalidOperationException("Spicetify was installed but its command wasn't found. Run setup again after opening a new Windows session.");
        }

        string config = Run(spicetify, "-c", true).Trim();
        if (!Path.IsPathRooted(config) || !config.EndsWith(".ini", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Spicetify didn't return a valid configuration path.");

        string userData = Path.GetDirectoryName(config);
        string extensions = Path.Combine(userData, "Extensions");
        Directory.CreateDirectory(extensions);
        using (Stream source = Assembly.GetExecutingAssembly().GetManifestResourceStream(Extension))
        {
            if (source == null) throw new InvalidOperationException("The installer is missing the Hanziify bundle.");
            using (Stream target = File.Create(Path.Combine(extensions, Extension)))
                source.CopyTo(target);
        }

        Run(spicetify, "config extensions " + Extension);
        bool backupExists = File.Exists(Path.Combine(userData, "Backup", "xpui.spa"));
        if (backupExists)
        {
            // Refresh an outdated backup if needed, then apply the new extension.
            Run(spicetify, "auto --no-restart");
            Run(spicetify, "apply");
        }
        else
        {
            Run(spicetify, "backup apply");
        }
    }

    private static string LocalData
    {
        get { return Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData); }
    }

    private static string FindSpicetify()
    {
        // WinGet can update the user's PATH without changing this process's PATH.
        return FindOnPath("spicetify.exe", Environment.GetEnvironmentVariable("PATH"))
            ?? ExistingFile(Path.Combine(LocalData, "Microsoft", "WinGet", "Links", "spicetify.exe"))
            ?? ExistingFile(Path.Combine(LocalData, "spicetify", "spicetify.exe"))
            ?? FindOnPath("spicetify.exe", Environment.GetEnvironmentVariable("PATH", EnvironmentVariableTarget.User));
    }

    private static string ExistingFile(string path)
    {
        return File.Exists(path) ? path : null;
    }

    private static string FindOnPath(string name, string path)
    {
        foreach (string part in (path ?? "").Split(Path.PathSeparator))
        {
            string directory = Environment.ExpandEnvironmentVariables(part.Trim().Trim('"'));
            if (!Path.IsPathRooted(directory)) continue;
            string candidate = Path.Combine(directory, name);
            if (File.Exists(candidate)) return candidate;
        }
        return null;
    }

    private static string Run(string executable, string arguments, bool capture = false)
    {
        var start = new ProcessStartInfo(executable, arguments)
        {
            UseShellExecute = false,
            RedirectStandardOutput = capture
        };
        if (capture) start.StandardOutputEncoding = Encoding.UTF8;
        using (Process process = Process.Start(start))
        {
            string output = capture ? process.StandardOutput.ReadToEnd() : "";
            process.WaitForExit();
            if (process.ExitCode != 0)
                throw new InvalidOperationException(
                    Path.GetFileName(executable) + " " + arguments + " exited with code " + process.ExitCode + ".");
            return output;
        }
    }
}
