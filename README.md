# Todo Lab

Todo Lab - веб-приложение для управления проектами и задачами. Сервис работает как простой аналог Trello / Jira / Notion: можно создавать проекты, вести задачи, назначать исполнителей, использовать теги, комментарии и напоминания.

В проекте есть backend на Spring Boot и готовый веб-интерфейс. Через сайт можно создавать проекты, задачи, менять статусы, перетаскивать карточки по канбан-доске, смотреть свои задачи и работать с пользователями.

## Что реализовано

- регистрация и вход в систему;
- роли пользователей `ADMIN` и `USER`;
- проекты;
- списки задач внутри проектов;
- задачи со статусами, приоритетами, сроками и исполнителем;
- теги;
- комментарии;
- напоминания;
- админский просмотр пользователей;
- фильтрация и поиск задач;
- канбан-доска с drag and drop;
- страница "Мои задачи";
- страница "Документы";
- настройки интерфейса;
- миграции базы данных через Liquibase;
- тесты и проверка покрытия через JaCoCo;
- `Actuator` для проверки состояния приложения.

Всего в предметной области 8 основных сущностей:

- `User`
- `Role`
- `Project`
- `TaskList`
- `Task`
- `Tag`
- `Comment`
- `Reminder`

## Стек

- Java 25
- Spring Boot 4.0.6
- Spring Web
- Spring Data JPA
- Spring Security
- PostgreSQL
- Liquibase
- Maven
- JUnit 5
- MockMvc
- Mockito
- H2 для тестов
- JaCoCo

## Как запустить

Сначала нужен PostgreSQL. Локальная конфигурация по умолчанию:

- база данных: `todo_lab`
- пользователь: `postgres`
- пароль: `123`
- порт приложения: `8081`

Если базы `todo_lab` ещё нет, её можно создать в `psql`:

```sql
CREATE DATABASE todo_lab;
```

Самый простой запуск:

```powershell
.\run-local.ps1
```

После запуска открыть:

```text
http://localhost:8081/
```

Проверка health endpoint:

```text
http://localhost:8081/actuator/health
```

## Демо-пользователи

После миграций Liquibase уже создаёт двух пользователей:

```text
Администратор:
admin@example.com
admin123
```

```text
Обычный пользователь:
demo@example.com
user123
```

## Проверка тестов

Обычный запуск тестов:

```powershell
.\mvnw.cmd test
```

Полная проверка вместе с JaCoCo:

```powershell
.\mvnw.cmd verify
```

Отчёт по покрытию появляется здесь:

```text
target/site/jacoco/index.html
```

В `pom.xml` стоит минимальная проверка покрытия строк - 70%.

## Основные REST endpoints

Авторизация:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Проекты:

- `GET /projects`
- `POST /projects`
- `GET /projects/{id}`
- `PUT /projects/{id}`
- `DELETE /projects/{id}`

Списки задач:

- `GET /task-lists`
- `POST /task-lists`
- `GET /task-lists/{id}`
- `PUT /task-lists/{id}`
- `DELETE /task-lists/{id}`

Задачи:

- `GET /tasks`
- `POST /tasks`
- `GET /tasks/{id}`
- `PUT /tasks/{id}`
- `DELETE /tasks/{id}`
- `PATCH /tasks/{id}/assignee`
- `PATCH /tasks/{id}/status`
- `PATCH /tasks/{id}/priority`
- `POST /tasks/{id}/tags/{tagId}`
- `DELETE /tasks/{id}/tags/{tagId}`

Теги, комментарии и напоминания:

- `GET /tags`
- `POST /tags`
- `GET /comments`
- `POST /comments`
- `GET /reminders`
- `POST /reminders`

Пользователи:

- `GET /users`
- `GET /users/{id}`
- `PUT /users/{id}`
- `DELETE /users/{id}`

## Структура проекта

Основной код лежит в:

```text
src/main/java/com/example/todolab
```

Основные пакеты:

- `controller` - REST-контроллеры;
- `service` - бизнес-логика;
- `repository` - работа с базой данных;
- `entity` - JPA-сущности;
- `dto` - объекты запросов и ответов;
- `config` - настройки безопасности и логирования;
- `exception` - обработка ошибок.

Миграции базы:

```text
src/main/resources/db/changelog
```

Веб-интерфейс:

```text
src/main/resources/static
```

Тесты:

```text
src/test/java
```
