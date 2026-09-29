# Cómo llevar Farmr a producción en AWS

Guía paso a paso para desplegar esta app en una instancia EC2 con una base
de datos RDS Postgres. Pensada para alguien sin experiencia previa en AWS.

## 0. Crear tu cuenta de AWS (si todavía no la tenés)

1. Andá a [aws.amazon.com](https://aws.amazon.com) y hacé clic en "Crear una
   cuenta de AWS".
2. Vas a necesitar: un email, una tarjeta de crédito/débito (para
   verificación — AWS no te cobra nada mientras uses la capa gratuita) y un
   número de teléfono para verificar por SMS o llamada.
3. Elegí el plan **Básico (gratis)**.
4. Una vez adentro, andá arriba a la derecha y elegí una región cercana a
   Paraguay — normalmente **South America (São Paulo) `sa-east-1`** es la
   más cercana. Usá siempre la misma región para todo lo que crees.
5. **Importante:** activá la autenticación en dos pasos (MFA) en tu usuario
   raíz (`IAM` → `Users` → tu usuario → `Security credentials`). Es tu
   cuenta con más permisos, conviene protegerla bien.

## 1. Crear la base de datos (RDS Postgres)

1. En la consola de AWS, buscá **RDS** y entrá.
2. `Create database` → `Standard create`.
3. Motor: **PostgreSQL** (versión 16 si está disponible, o la más reciente
   16.x).
4. Plantilla: **Free tier** (para arrancar) o **Dev/Test** si ya no calificás
   para la capa gratuita.
5. Configuración:
   - DB instance identifier: `farmrapp-db`
   - Master username: `farmrapp`
   - Master password: generá una contraseña segura y **guardala** (la vas
     a necesitar para el `.env`).
6. Instance: `db.t3.micro` (capa gratuita) o `db.t4g.micro`.
7. Storage: 20 GB está bien para empezar.
8. **Connectivity**: "Don't connect to an EC2 compute resource" por ahora
   (lo conectamos manualmente). Public access: **No** (más seguro — solo tu
   EC2 va a poder conectarse, vía el mismo grupo de seguridad).
9. Initial database name: `farmrapp`.
10. Creá la base. Tarda unos minutos en estar lista.
11. Cuando esté "Available", anotá el **Endpoint** (algo como
    `farmrapp-db.xxxxxxx.sa-east-1.rds.amazonaws.com`) — es lo que va en
    `DATABASE_URL`.

## 2. Crear el servidor (EC2)

1. Buscá **EC2** en la consola → `Launch instance`.
2. Nombre: `farmrapp-server`.
3. AMI (imagen): **Ubuntu Server 24.04 LTS**.
4. Tipo de instancia: `t3.small` para empezar (2 GB RAM; `t3.micro` con 1 GB
   puede quedarse corto al compilar Next.js).
5. Key pair: creá una nueva, descargá el archivo `.pem` y **guardalo bien**
   — es la única forma de entrar por SSH.
6. Configuración de red / Security group: creá uno nuevo que permita:
   - SSH (puerto 22) — solo desde tu IP, no "Anywhere", por seguridad.
   - HTTP (puerto 80) — desde cualquier lado (Anywhere / 0.0.0.0/0).
   - HTTPS (puerto 443) — desde cualquier lado.
7. Storage: 20 GB alcanza para empezar.
8. Lanzá la instancia.
9. Una vez arriba, anotá su **IP pública**.

### Conectar el EC2 con la base RDS

En el security group de **RDS** (no el del EC2), agregá una regla de
entrada: tipo PostgreSQL (puerto 5432), origen = el security group del EC2
(elegilo del desplegable, no pongas una IP). Así solo tu servidor puede
conectarse a la base.

## 3. Preparar el servidor

Conectate por SSH (reemplazá la ruta al `.pem` y la IP):

```bash
chmod 400 tu-clave.pem
ssh -i tu-clave.pem ubuntu@IP_PUBLICA_DEL_EC2
```

Instalá lo necesario:

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (mantiene la app corriendo y la reinicia si se cae)
sudo npm install -g pm2

# Nginx (proxy reverso) y Certbot (HTTPS gratis)
sudo apt install -y nginx certbot python3-certbot-nginx

# Git
sudo apt install -y git
```

## 4. Traer y configurar la app

```bash
cd ~
git clone https://github.com/hilderandy/farmrapp.git
cd farmrapp
npm install
```

Creá el `.env` de producción a partir del ejemplo:

```bash
cp .env.production.example .env
nano .env
```

Completá:
- `DATABASE_URL` con el endpoint de RDS, usuario y contraseña reales del
  paso 1.
- `SESSION_SECRET` con una clave nueva: corré `openssl rand -base64 32` y
  pegá el resultado.

Sincronizá el schema con la base y creá tu usuario administrador:

```bash
npm run db:push
ADMIN_USERNAME=admin ADMIN_PASSWORD="unaClaveSeguraDeVerdad" npm run db:create-admin
```

Compilá la app:

```bash
npm run build
```

## 5. Levantar la app con PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # te va a mostrar un comando para copiar y pegar — ejecutalo
```

Con esto la app queda corriendo en el puerto 3000 y se reinicia sola si el
servidor reinicia o si la app se cae.

Comandos útiles:

```bash
pm2 status          # ver si está corriendo
pm2 logs farmrapp    # ver logs en vivo
pm2 restart farmrapp # reiniciar después de un deploy
```

## 6. Configurar Nginx + HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/farmrapp
sudo nano /etc/nginx/sites-available/farmrapp   # cambiá "tu-dominio.com" por tu dominio real
sudo ln -s /etc/nginx/sites-available/farmrapp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Si ya tenés un dominio apuntando a la IP del EC2 (registro DNS tipo `A`):

```bash
sudo certbot --nginx -d tu-dominio.com
```

Certbot configura HTTPS automáticamente y renueva el certificado solo.

Si todavía no tenés dominio, podés probar con la IP pública por HTTP
mientras tanto, pero para producción de verdad conviene comprar un dominio
(en Route 53, Namecheap, etc.) antes de este paso.

## 7. Actualizar la app después de cambios

Cada vez que quieras subir cambios nuevos:

```bash
cd ~/farmrapp
git pull
npm install
npm run db:push       # solo si cambió el schema de la base
npm run build
pm2 restart farmrapp
```

## Checklist antes de anunciar que está en producción

- [ ] `SESSION_SECRET` y la contraseña de RDS son valores generados de
      verdad, no los de ejemplo.
- [ ] El acceso SSH al EC2 está restringido a tu IP, no abierto a todos.
- [ ] RDS tiene "Public access" en No.
- [ ] El sitio carga por HTTPS (candado verde), no solo HTTP.
- [ ] Probaste el login con el usuario administrador real.
- [ ] Activaste backups automáticos en RDS (por defecto vienen prendidos,
      pero confirmá el período de retención en la consola de RDS).
