param(
    [int]$Port = 8081,
    [string]$JavaHome = "C:\Program Files\BellSoft\LibericaJDK-25",
    [string]$DbUrl = "jdbc:postgresql://localhost:5432/todo_lab",
    [string]$DbUsername = "postgres",
    [string]$DbPassword = "123"
)

$env:JAVA_HOME = $JavaHome
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:DB_URL = $DbUrl
$env:DB_USERNAME = $DbUsername
$env:DB_PASSWORD = $DbPassword

Write-Host "Starting Todo Lab on port $Port" -ForegroundColor Cyan
Write-Host "Database: $DbUrl" -ForegroundColor DarkCyan

.\mvnw.cmd "-Djava.version=25" spring-boot:run "-Dspring-boot.run.arguments=--server.port=$Port"
