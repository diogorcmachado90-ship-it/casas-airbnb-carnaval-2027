# Lista de casas do Carnaval (servidor local)

Você liga o servidor no seu computador e o grupo acessa e edita a mesma lista pelo navegador.

## 1. Pré-requisito (uma vez só)
Instale o Node.js (gratuito): https://nodejs.org (versão LTS).
Para conferir, abra o terminal e rode: `node --version`

## 2. Ligar o servidor
Abra o terminal DENTRO desta pasta e rode:

    node server.js

Deve aparecer: "Servidor no ar: http://localhost:3000".
Abra http://localhost:3000 no seu navegador para testar.

**Recomendado: proteger com senha** (senão qualquer pessoa com o link edita):

- Mac/Linux:   `SENHA=minhasenha node server.js`
- Windows (PowerShell):   `$env:SENHA="minhasenha"; node server.js`

O navegador vai pedir usuário e senha: o usuário pode ser qualquer coisa, a senha é a que você definiu.

## 3. Deixar o pessoal acessar de fora da sua casa
`localhost` só funciona no seu computador. Para gerar um link público, use um túnel.
Com o servidor rodando, abra OUTRO terminal.

### Opção A: Cloudflare Tunnel (sem criar conta)
Instale o cloudflared:
- Windows: `winget install Cloudflare.cloudflared`
- Mac: `brew install cloudflared`
- Outros: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

Depois rode:

    cloudflared tunnel --url http://localhost:3000

Ele mostra um endereço terminado em `trycloudflare.com`. Mande esse link ao grupo.
O endereço muda toda vez que você reinicia o túnel.

### Opção B: ngrok (precisa de conta gratuita)
Instale e configure o ngrok (https://ngrok.com) e rode:

    ngrok http 3000

Mande ao grupo o endereço `https://...` que ele mostrar.

## 4. Adicionar uma casa pelo anúncio
No site, abra **Adicionar casa**. O método recomendado é copiar o texto visível da página do Airbnb, colá-lo na caixa de texto e clicar em **Extrair dados do texto copiado**. Confira os campos preenchidos, ajuste o que faltar e clique em **Adicionar casa**. O botão **Tentar obter alguns dados só pelo link** pode retornar menos informações, pois o Airbnb nem sempre expõe os detalhes. O preço só será importado se estiver no texto; confirme datas e hóspedes. Camas, comodidades e distâncias também podem precisar de revisão.

## 5. Atualizar o programa no Windows
Com o servidor parado, clique duas vezes em `atualizar.bat` na pasta do projeto. O atualizador baixa os arquivos mais recentes do GitHub e não altera `dados.json`, onde ficam os dados da lista. Depois, inicie o servidor e o túnel novamente. Para obter o atualizador pela primeira vez, baixe e extraia a versão mais recente do projeto.

## 6. Exportar a lista
Clique em **Baixar lista completa para Excel (CSV)** para baixar um arquivo que pode ser aberto no Excel ou compartilhado. Ele inclui todas as casas não removidas, independentemente dos filtros, os preços salvos e o valor por pessoa calculado com o número de pessoas escolhido. O arquivo reflete a lista que está na página; confira se ela está conectada ao servidor antes de exportar. O CSV não substitui o backup de `dados.json` e não pode ser restaurado no site.

## 7. Importante
- Seu computador precisa ficar ligado, com o servidor (e o túnel) rodando, enquanto o grupo usa.
- Os dados ficam no arquivo `dados.json`, nesta pasta. Faça uma cópia dele se quiser guardar.
- Para desligar: Ctrl+C nos terminais.
- Se a casa mudar de preço no Airbnb, atualize o campo da casa na página.
