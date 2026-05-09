# iCare - hipodermóclise

Aplicação web sobre o uso de hipodermóclise baseado em evidências.

## Arquivos do projeto

- `index.html`: conteúdo e estrutura do site.
- `styles.css`: estilos visuais e responsividade.
- `app.js`: interações, abas, checklists, assistente de voz e contador de visitas.
- `assets/`: imagens usadas no site.
- `.nojekyll`: evita processamento pelo Jekyll no GitHub Pages.
- `.gitignore`: evita envio de arquivos grandes ou temporários para o GitHub.

## Vídeo da técnica de punção

O vídeo da técnica de punção é carregado por um player do Google Drive na aba Técnica de punção.

Para publicar o vídeo junto ao site no GitHub Pages, use uma das opções:

Se quiser usar vídeo local no futuro, mantenha o arquivo abaixo de 100 MB ou use Git LFS.

Arquivos de vídeo locais continuam ignorados no `.gitignore` para evitar bloqueio no GitHub.

## Publicação no GitHub Pages

Este é um site estático. Para publicar no GitHub Pages, use a raiz do repositório como fonte da branch principal.

Passos sugeridos:

1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. No GitHub, acesse `Settings` > `Pages`.
4. Em `Build and deployment`, selecione `Deploy from a branch`.
5. Escolha a branch principal e a pasta raiz (`/root`).
6. Salve e aguarde o endereço publicado pelo GitHub Pages.
