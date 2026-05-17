# Памятка по проекту

Короткая шпаргалка для запуска и проверки проекта.

## Быстрый запуск

1. Проверить, что PostgreSQL запущен.
2. Проверить, что есть база данных `todo_lab`.
3. Запустить:

```powershell
.\run-local.ps1
```

4. Открыть сайт:

```text
http://localhost:8081/
```

## Данные для входа

Администратор:

```text
admin@example.com
admin123
```

Пользователь:

```text
demo@example.com
user123
```

## Если порт занят

Можно запустить на другом порту:

```powershell
.\run-local.ps1 -Port 8082
```

Тогда сайт будет здесь:

```text
http://localhost:8082/
```

## Если другой пароль от PostgreSQL

Например:

```powershell
.\run-local.ps1 -DbPassword "мой_пароль"
```

## Проверка работы

Health check:

```text
http://localhost:8081/actuator/health
```

Должен быть ответ:

```json
{"status":"UP"}
```

## Тесты

Запуск тестов:

```powershell
.\mvnw.cmd test
```

Полная проверка с покрытием:

```powershell
.\mvnw.cmd verify
```

## Перед публикацией

- Проверить, что README на русском и понятно описывает запуск.
- Выполнить полную проверку проекта:

```powershell
.\mvnw.cmd verify
```
