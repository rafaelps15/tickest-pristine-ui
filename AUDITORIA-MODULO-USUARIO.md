# Auditoria do front-end: módulo de usuário — 29/09/2026

Comparação do front-end (Angular) com o back-end .NET (`C:\dev\tickest-pristine`), com foco em **Editar Perfil, Desativar Usuário, Troca de Senha e Logout**.

Os bugs 1.1 e 1.2 foram confirmados com chamadas reais à API.

---

## Situação das 4 funcionalidades

| Funcionalidade | Back-end | Front-end |
|---|---|---|
| **Editar perfil** | ✅ `PUT users/{id}/profile`, pronto (ainda sem commit) | ❌ Não existe: falta o método no serviço, o store, a tela, a rota e o link no menu |
| **Desativar usuário** | ❌ O `User` não tem `IsActive`, não há endpoint, e o login não bloqueia usuários inativos | ❌ Não existe |
| **Trocar senha** | ❌ Não existe | ❌ Não existe |
| **Logout** | ❌ Não há endpoint para revogar o refresh token | ⚠️ Parcial: limpa a sessão local e vai para `/login`, mas o refresh token continua válido no servidor por 7 dias |

**Resumo:** das 4, só "Editar perfil" pode ser feita no front agora. As outras três dependem primeiro do back.

---

## 1. O que está errado

### 1.1 Erros de validação aparecem como `[object Object]` (alta, afeta todos os formulários)

- **Onde:** `src/app/shared/utils/http-error.util.ts`
- **Problema:** o front espera `errors` como um dicionário de strings (`Record<string, string[]>`), no formato padrão do ASP.NET. O back devolve uma **lista de objetos**. Resposta real da API:

  ```json
  {
    "title": "Validation.General",
    "status": 400,
    "detail": "Um ou mais erros de validação ocorreram",
    "errors": [
      { "code": "MinimumLengthValidator", "description": "A senha deve ter no mínimo 6 caracteres.", "type": 2 },
      { "code": "RegularExpressionValidator", "description": "A senha deve conter pelo menos uma letra maiúscula.", "type": 2 }
    ]
  }
  ```

  O `Object.values(...).flat().join(' ')` transforma essa lista em `"[object Object] [object Object] ..."`. Ou seja, **nenhuma mensagem de validação do back chega legível ao usuário**, e isso vale para o cadastro e para qualquer outro formulário.

### 1.2 A mensagem de login errado nunca aparece (média)

- **Onde:** `src/app/shared/application/login.store.ts` junto com `http-error.util.ts`
- **Problema:** o `LoginStore` define `404 → 'E-mail ou senha incorretos.'`. Só que o `extractErrorMessage` dá prioridade à mensagem da API, então o usuário vê **"Usuário com o e-mail informado não foi encontrado"** mesmo quando o erro foi a senha. Isso confunde o usuário e ainda indica se o e-mail existe ou não.

### 1.3 Qualquer 403 desconecta o usuário (alta)

- **Onde:** `src/app/shared/interceptors/auth.interceptor.ts`
- **Problema:** o bloco `if (error.status === 401 || error.status === 403)` limpa a sessão e manda para `/login`. Mas no back um 403 significa "logado, sem permissão para isso". Exemplos: tentar editar o perfil de outra pessoa, ou mexer num ticket que não é seu. Hoje, qualquer negação de permissão **derruba a sessão** do usuário em vez de mostrar um aviso.

### 1.4 A regra de senha do cadastro diverge do back (alta)

- **Onde:** `src/app/users/feature-register/register.component.ts:37` e `register.component.html:85`
- **Regra do back** (`RegisterUserCommandValidator`): mínimo de 6 caracteres, pelo menos 1 letra maiúscula e pelo menos 1 caractere especial (`#`, `$`, `%` etc.).
- **Problema:**
  - O front só valida `Validators.minLength(6)`.
  - Uma senha como `senha123` passa no front e é recusada pelo back. Por causa do bug 1.1, o usuário ainda recebe `[object Object]` como explicação.
  - A mensagem fixa "Mínimo de 6 caracteres." não cobre as outras regras.

### 1.5 O contrato de `GET /users/{id}` está errado (média, vai quebrar o perfil)

- **Onde:** `src/app/users/entities/user-summary.ts` e `src/app/users/infrastructure/user.data.service.ts:15`
- **Problema:** o `getById` está tipado como `UserSummary`, que inclui `roles`. O back devolve `UserResponse`: `{ id, email, firstName, lastName }`, **sem `roles`**. Hoje nada chama o `getById`, mas a tela de perfil vai chamar, e `user.roles` vai ser `undefined`.

### 1.6 Regras de nome divergem (baixa)

- **Onde:** `src/app/users/feature-register/register.component.ts:34-35`
- **Problema:** o front exige nome e sobrenome com 2 a 50 caracteres. O back só exige que não estejam vazios. O front ser mais rígido não quebra nada, mas a regra devia ficar num lugar só. Se 50 caracteres for a regra de negócio, ela deveria estar no back também, com uma migration limitando o tamanho da coluna.

---

## 2. O que falta para finalizar

| Item | Situação atual | O que fazer |
|---|---|---|
| **Toasts / feedback** | Não existem. Os erros aparecem como alerta no próprio formulário, e o sucesso quase não tem feedback. | Criar um `ToastService` em `shared/` com signals, e um componente de toast no `MainLayout` |
| **Modal de confirmação** | Departamentos, setores e tickets usam o `confirm()` nativo do navegador | Criar um `ConfirmDialogComponent` em `shared/ui/` e usá-lo na desativação de usuário (e depois trocar os `confirm()` existentes) |
| **Tratamento de 403** | Desloga o usuário (bug 1.3) | Mostrar um toast "Você não tem permissão para esta ação" e manter a sessão |
| **Logout** | Só no lado do cliente | Quando o back tiver `POST users/logout`, chamar esse endpoint antes do `clearSession()`, e limpar a sessão mesmo se a chamada falhar |
| **Refresh falhou** | Vai para o login sem nenhum aviso | Mostrar o toast "Sua sessão expirou. Faça login novamente." |
| **Tela de perfil** | Não existe | Criar `users/feature-profile/` com a rota `/perfil` e um link no menu do usuário (onde fica o "Sair") |

---

## 3. Correções sugeridas

Seguem as convenções do `CLAUDE.md` deste repositório: domínios em `src/app/{domain}/`, Signal Store e comentários `/** ... */` em português.

### 3.1 Corrigir o `extractErrorMessage` para o formato do back

```ts
/** Erro individual de validação, no formato devolvido pelo back-end ({ code, description, type }). */
interface ApiValidationError {
  code: string;
  description: string;
}

// dentro de extractErrorMessage:
const validationErrors: ApiValidationError[] | undefined = err.error?.errors;
const validationMessage = Array.isArray(validationErrors)
  ? validationErrors.map(e => e.description).join(' ')
  : undefined;
```

Para corrigir o bug 1.2, acrescente um parâmetro opcional `preferStatusMessage`. Com ele ligado, a mensagem do `statusMessages` passa na frente da mensagem da API. O `LoginStore` usaria essa opção.

### 3.2 O interceptor não deve deslogar em 403

```ts
if (error.status === 401) {
  session.clearSession();
  router.navigate(['/login']);
}
// 403: mantém a sessão; a tela trata a mensagem (ou exibe um toast global).
```

### 3.3 Um validador de senha compartilhado

Ele espelha o `RegisterUserCommandValidator` e fica em `shared/validators/`, para ser usado no cadastro e na troca de senha:

```ts
/** Valida a senha com as mesmas regras do back-end: 6+ caracteres, 1 maiúscula e 1 caractere especial. */
export const strongPasswordValidator: ValidatorFn = (control) => {
  const value: string = control.value ?? '';
  const errors: ValidationErrors = {};
  if (value.length < 6) errors['minLength'] = true;
  if (!/\p{Lu}/u.test(value)) errors['uppercase'] = true;
  if (!/[^\p{L}\p{N}\s]/u.test(value)) errors['specialChar'] = true;
  return Object.keys(errors).length ? errors : null;
};
```

No template, mostre uma mensagem por regra, com os mesmos textos do back:

- `minLength` → "A senha deve ter no mínimo 6 caracteres."
- `uppercase` → "A senha deve conter pelo menos uma letra maiúscula."
- `specialChar` → "A senha deve conter pelo menos um caractere especial (ex.: #, $, %)."

### 3.4 Contratos iguais aos do back

Um tipo por resposta, como no back:

```ts
/** Perfil do usuário, conforme retornado por GET /users/{id} (UserResponse no back-end). */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

/** Corpo de PUT /users/{id}/profile (espelha UpdateUserProfileCommand). */
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}
```

No `UserDataService`:

- acrescente `updateProfile(userId: string, request: UpdateProfileRequest): Observable<void>`;
- corrija o tipo de retorno do `getById` para `Observable<UserProfile>`.

O `userId` do usuário logado já está disponível em `SessionService.userId()` (claim `sub` do JWT).

### 3.5 CQRS no front

Mantenha a correspondência de um para um entre os dois lados:

| Back-end | Front-end |
|---|---|
| **Comando** (`UpdateUserProfileCommand`, `ChangePasswordCommand`, `DeactivateUserCommand`) | Método de escrita no data service (`updateProfile`, `changePassword`, `deactivate`) |
| **Query** (`GetUserByIdQuery`, `GetAllUsersQuery`) | Método de leitura (`getById`, `getAll`) |
| **Resposta** (`UserResponse`) | Interface em `entities/` (`UserProfile`) |

O store da tela (`ProfileStore`) orquestra essas chamadas e o estado de loading, erro e sucesso, no mesmo modelo do `LoginStore` que já existe.

---

## 4. Ordem sugerida

1. **Front, correções rápidas:** bugs 1.1, 1.2, 1.3, 1.4 e 1.5. São pequenos, e sem eles nenhuma tela nova vai mostrar erros direito.
2. **Front, tela de perfil:** o back já está pronto.
3. **Back, depois front:** troca de senha, depois logout com revogação, depois desativação (que precisa de `IsActive` e de uma migration).
4. **Infraestrutura de UI no front:** `ToastService` e `ConfirmDialog`. O ideal é que existam antes da desativação, que depende do modal de confirmação.

---

## Observação

Na data desta auditoria, este repositório tem **102 alterações sem commit**, de uma reestruturação em andamento (os serviços de `src/app/application/services/` foram apagados e as pastas de domínio ainda não estão no git). Recomendo fazer o commit dessa reestruturação antes de aplicar as correções acima.
