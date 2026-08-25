-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "port" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "environment" TEXT,
    "folderPath" TEXT,
    "script" TEXT NOT NULL DEFAULT 'npm start',
    "autostart" BOOLEAN NOT NULL DEFAULT false,
    "pm2Name" TEXT,
    "env" TEXT,
    "autorestart" BOOLEAN NOT NULL DEFAULT true,
    "restartDelay" INTEGER NOT NULL DEFAULT 1000,
    "maxRestarts" INTEGER NOT NULL DEFAULT 10,
    "maxMemoryRestart" TEXT,
    "categoryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("active", "autorestart", "autostart", "createdAt", "description", "env", "environment", "folderPath", "icon", "id", "maxMemoryRestart", "maxRestarts", "name", "pm2Name", "port", "restartDelay", "script", "updatedAt") SELECT "active", "autorestart", "autostart", "createdAt", "description", "env", "environment", "folderPath", "icon", "id", "maxMemoryRestart", "maxRestarts", "name", "pm2Name", "port", "restartDelay", "script", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
