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
    "folderPath" TEXT,
    "script" TEXT NOT NULL DEFAULT 'npm start',
    "autostart" BOOLEAN NOT NULL DEFAULT false,
    "pm2Name" TEXT,
    "env" TEXT,
    "autorestart" BOOLEAN NOT NULL DEFAULT true,
    "restartDelay" INTEGER NOT NULL DEFAULT 1000,
    "maxRestarts" INTEGER NOT NULL DEFAULT 10,
    "maxMemoryRestart" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("active", "autostart", "createdAt", "description", "folderPath", "icon", "id", "name", "pm2Name", "port", "script", "updatedAt") SELECT "active", "autostart", "createdAt", "description", "folderPath", "icon", "id", "name", "pm2Name", "port", "script", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_ProjectProcess" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "folderPath" TEXT NOT NULL,
    "script" TEXT NOT NULL DEFAULT 'npm start',
    "port" INTEGER NOT NULL,
    "env" TEXT,
    "autorestart" BOOLEAN NOT NULL DEFAULT true,
    "restartDelay" INTEGER NOT NULL DEFAULT 1000,
    "maxRestarts" INTEGER NOT NULL DEFAULT 10,
    "maxMemoryRestart" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectProcess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjectProcess" ("createdAt", "folderPath", "id", "label", "port", "projectId", "script", "updatedAt") SELECT "createdAt", "folderPath", "id", "label", "port", "projectId", "script", "updatedAt" FROM "ProjectProcess";
DROP TABLE "ProjectProcess";
ALTER TABLE "new_ProjectProcess" RENAME TO "ProjectProcess";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
