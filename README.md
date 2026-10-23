# ACK CV Maker

CV oluşturmak, farklı tasarımları önizlemek ve PDF veya Word olarak indirmek için ASP.NET Core ve React ile hazırlanmış uygulama.

## Gereksinimler

- .NET 10 SDK
- Node.js ve pnpm

## Çalıştırma

1. İstemci bağımlılıklarını yükleyip üretim paketini oluşturun:

   ```powershell
   cd ClientApp
   pnpm install
   pnpm run build
   cd ..
   ```

2. Uygulamayı başlatın:

   ```powershell
   dotnet run
   ```

CV bilgileri tarayıcıda yerel olarak saklanır. Mobil tarayıcılarda uygulama ana ekrana eklenebilir.
