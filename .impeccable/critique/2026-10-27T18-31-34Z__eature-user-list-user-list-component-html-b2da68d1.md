---
target: tela de Usuários
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\users\\feature-user-list\\user-list.component.html"
target_fingerprint: "sha256:5933acc52c004e94abde4b9960de142afb67142974eaddfeb43abb0e6fb8e4c4"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\users\\feature-user-list\\user-list.component.html"
timestamp: 2026-10-27T18-31-34Z
slug: eature-user-list-user-list-component-html-b2da68d1
---
Method: dual-agent (A: revisão de design · B: detector + navegador) — navegador indisponível nas duas (extensão do Chrome desconectada).

## Nota de design: 23/40 (Aceitável)

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status | 3 | Usuário recém-criado não é destacado |
| 2 | Correspondência com o mundo real | 2 | Sem departamento/setor/chamados; admin inventa a senha |
| 3 | Controle e liberdade | 2 | Sem "Desfazer" ao desativar; salvar funções sem diff |
| 4 | Consistência e padrões | 3 | Sem .table-stack no celular; "Editar Cadastro" x "Editar cadastro" |
| 5 | Prevenção de erros | 2 | Pode tirar a própria função Admin; zero funções; regras de senha só após erro |
| 6 | Reconhecimento em vez de memória | 2 | "+N" até no painel; funções sem descrição |
| 7 | Flexibilidade e eficiência | 2 | Sem ordenação, sem filtro por função; lote só desativa |
| 8 | Estética e minimalismo | 2 | Guia aberto por padrão; painel repete a linha |
| 9 | Recuperação de erros | 2 | Falha de desativação com "Recarregar lista" |
| 10 | Ajuda e documentação | 3 | Guia explica o óbvio, não o que cada função dá |

## Veredito de especificidade
Intercambiável com qualquer admin Bootstrap — nada sabe que é um helpdesk com departamentos, setores e SLA. Caráter só no acabamento (a11y, URL sem dado pessoal, estados vazios). Detector: 3 achados design-system-color rgb(0,0,0), todos falsos positivos (cor herdada de --tk-text-primary).

## Pontos fortes
1. Desativação segura e reversível (guarda de auto-desativação, lote só elegíveis, falha parcial por nome).
2. Estado na URL sem dado pessoal; página além do total se corrige; período invertido vira mensagem.
3. Acabamento de a11y e estados acima da média.

## Problemas prioritários
- [P1] Cadastro termina incompleto (sem funções no modal, senha inventada, sem "criar e cadastrar outro") — /impeccable shape. Convite/senha temporária depende do back-end.
- [P1] Substituir funções sem guardas (pode remover a própria função Admin; zero funções; sem diff) — /impeccable harden.
- [P1] Desativar ignora o domínio (chamados em aberto do atendente; sem "Desfazer"; "dele/deles") — /impeccable clarify. Contagem de chamados depende do back-end.
- [P2] Painel lateral só repete a linha e trunca funções — /impeccable distill.
- [P2] Filtros miram a pergunta errada (sem filtro por função/"Sem função", período ocupa 1/3, sem ordenação, Guia aberto por padrão) — /impeccable layout.

## Red flags por persona
- Alex: sem ordenação/filtro por função/atalho de busca; lote perde seleção ao paginar e só desativa; modal de criação fecha a cada cadastro.
- Sam: "+N" é span focável com aria-label sem papel (no painel, inalcançável); aria-pressed + rótulo Ver/Fechar duplicado; foco salta pro painel no desktop e perde o lugar na tabela; aria-live do lote nasce com o conteúdo.
- Renata (admin integrando 15 contratados): 15 ciclos criar → atribuir; 15 senhas fora do sistema; sem setor; sem filtro "sem função".

## Observações menores
"Desativado em" em vermelho; "Cadastrado em" com HH:mm; getRoleColor parseia localStorage por badge; pageSizeOptions duplicado; rótulo "Filtros" redundante; reativar pede confirmação; Guia precisa explicar as duas seleções.

## Perguntas
1. Por que a ficha do colaborador não mostra nada sobre os chamados dele?
2. O Admin Master deveria conhecer a senha de cada funcionário?
3. Como seria atribuir funções vendo o que cada uma libera, ou pelo departamento?
