using System.Diagnostics;
using System.Net.Http;

const int port = 8081;
const string appUrl = "http://localhost:8081/?v=20260426-delete-project-fix";
const string healthUrl = "http://localhost:8081/actuator/health";

var projectRoot = AppContext.BaseDirectory;
var scriptPath = Path.Combine(projectRoot, "run-local.ps1");

if (!File.Exists(scriptPath))
{
    Console.Error.WriteLine("run-local.ps1 was not found next to TodoLabLauncher.exe.");
    Console.Error.WriteLine("Put TodoLabLauncher.exe in the project root folder and run it again.");
    PauseIfInteractive();
    Environment.ExitCode = 1;
    return;
}

Console.Title = "Todo Lab Launcher";
Console.WriteLine("Todo Lab launcher");
Console.WriteLine($"Project: {projectRoot}");
Console.WriteLine($"URL:     {appUrl}");
Console.WriteLine();

if (!await IsHealthy())
{
    StartServer(projectRoot, scriptPath);
    Console.WriteLine("Waiting for Spring Boot to start...");
    await WaitForHealth();
}
else
{
    Console.WriteLine($"Todo Lab is already running on port {port}.");
}

OpenBrowser(appUrl);
Console.WriteLine("Browser opened. You can close this launcher window.");

static void StartServer(string projectRoot, string scriptPath)
{
    Console.WriteLine("Starting local server...");

    var startInfo = new ProcessStartInfo
    {
        FileName = "powershell.exe",
        Arguments = $"-ExecutionPolicy Bypass -NoExit -File \"{scriptPath}\"",
        WorkingDirectory = projectRoot,
        UseShellExecute = true
    };

    Process.Start(startInfo);
}

static async Task WaitForHealth()
{
    for (var attempt = 1; attempt <= 60; attempt++)
    {
        if (await IsHealthy())
        {
            Console.WriteLine("Server is ready.");
            return;
        }

        Console.Write(".");
        await Task.Delay(2000);
    }

    Console.WriteLine();
    Console.WriteLine("Server did not answer in time, opening the browser anyway.");
}

static async Task<bool> IsHealthy()
{
    try
    {
        using var client = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(2)
        };

        var response = await client.GetAsync(healthUrl);
        return response.IsSuccessStatusCode;
    }
    catch
    {
        return false;
    }
}

static void OpenBrowser(string url)
{
    try
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }
    catch (Exception exception)
    {
        Console.Error.WriteLine("Failed to open browser.");
        Console.Error.WriteLine(exception.Message);
        PauseIfInteractive();
    }
}

static void PauseIfInteractive()
{
    if (Environment.UserInteractive)
    {
        Console.WriteLine("Press Enter to close...");
        Console.ReadLine();
    }
}
