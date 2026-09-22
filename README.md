# 🧪 Bio-Match: A.I. Core

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Gemini API](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

Aplicação web interativa e gamificada desenvolvida como projeto interdisciplinar (Biologia e Desenvolvimento de Sistemas). O objetivo é aumentar o engajamento dos alunos na revisão de conteúdos por meio de mecânicas de *time-pressure* e Inteligência Artificial generativa.

## 🚀 Arquitetura e Funcionalidades

* **Integração com LLM:** Uso da API do Google Gemini (modelo `gemini-3.5-flash-lite`) para atuar como um "Oráculo" em tempo real, fornecendo dicas dinâmicas e corrigindo erros de forma didática com base nas respostas dos usuários.
* **Client-Side Storage:** Utilização de `LocalStorage` para persistência do banco de dados de perguntas, configurações de API e placar, permitindo que a aplicação rode 100% no navegador sem dependência de um backend em nuvem.
* **Audio Synthesis:** Implementação nativa da *Web Audio API* para geração procedural de efeitos sonoros (SFX) durante a partida, eliminando o carregamento de arquivos MP3 externos.
* **Mecânica de Eustresse:** Temporizador assíncrono projetado para gerar atenção seletiva através de estímulos visuais e sonoros nos segundos finais.

## ⚙️ Como rodar o projeto localmente

1. Clone o repositório:
   ```bash
   git clone [https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git](https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git)