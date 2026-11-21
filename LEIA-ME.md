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
No site, abra **Adicionar casa**. Você pode colar o link e clicar em **Ler anúncio e preencher dados** ou copiar o texto visível da página do Airbnb, colá-lo na caixa de texto e clicar em **Preencher a partir do texto**. Confira os campos preenchidos, ajuste o que faltar e clique em **Adicionar casa**. Se o Airbnb bloquear a leitura do link, colar o texto costuma trazer mais informações. O preço só será importado se estiver no texto; confirme datas e hóspedes. Camas, comodidades e distâncias podem precisar de revisão.

## 5. Importante
- Seu computador precisa ficar ligado, com o servidor (e o túnel) rodando, enquanto o grupo usa.
- Os dados ficam no arquivo `dados.json`, nesta pasta. Faça uma cópia dele se quiser guardar.
- Para desligar: Ctrl+C nos terminais.
- Se a casa mudar de preço no Airbnb, atualize o campo da casa na página.
