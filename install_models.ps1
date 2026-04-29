
$baseDir = "node_modules\@imgly\background-removal-data\dist"
$resourceJson = Join-Path $baseDir "resources.json"
$targetDir = "public\models"
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

function Concat-ChunkFiles {
    param (
        [string[]]$chunkFileNames,
        [string]$outputFile
    )
    $outputStream = [System.IO.File]::Create($outputFile)
    foreach ($fileName in $chunkFileNames) {
        $chunkPath = Join-Path $baseDir $fileName
        if (!(Test-Path $chunkPath)) {
            throw "Missing chunk file: $fileName"
        }
        $chunkBytes = [System.IO.File]::ReadAllBytes($chunkPath)
        $outputStream.Write($chunkBytes, 0, $chunkBytes.Length)
    }
    $outputStream.Close()
    Write-Host "Created $outputFile"
}

$resources = Get-Content $resourceJson -Raw | ConvertFrom-Json

$smallChunkNames = @($resources."/models/small".chunks | ForEach-Object { $_.hash })
Concat-ChunkFiles -chunkFileNames $smallChunkNames -outputFile (Join-Path $targetDir "isnet_quint8.onnx")

$mediumChunkNames = @($resources."/models/medium".chunks | ForEach-Object { $_.hash })
Concat-ChunkFiles -chunkFileNames $mediumChunkNames -outputFile (Join-Path $targetDir "isnet.onnx")

New-Item -ItemType Directory -Force -Path (Join-Path $targetDir "onnxruntime-web") | Out-Null
Copy-Item "node_modules\onnxruntime-web\dist\ort-wasm-simd-threaded.mjs" (Join-Path $targetDir "onnxruntime-web\ort-wasm-simd-threaded.mjs") -Force
Copy-Item "node_modules\onnxruntime-web\dist\ort-wasm-simd-threaded.wasm" (Join-Path $targetDir "onnxruntime-web\ort-wasm-simd-threaded.wasm") -Force
Copy-Item "node_modules\onnxruntime-web\dist\ort-wasm-simd-threaded.jsep.mjs" (Join-Path $targetDir "onnxruntime-web\ort-wasm-simd-threaded.jsep.mjs") -Force
Copy-Item "node_modules\onnxruntime-web\dist\ort-wasm-simd-threaded.jsep.wasm" (Join-Path $targetDir "onnxruntime-web\ort-wasm-simd-threaded.jsep.wasm") -Force

Write-Host "Copied onnxruntime-web assets"
