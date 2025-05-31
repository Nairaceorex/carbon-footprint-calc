# Базовый образ
FROM node:18.20.8

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

# Открываем порт для Vite
EXPOSE 5173

# Команда для запуска
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]