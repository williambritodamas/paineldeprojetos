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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("active", "createdAt", "description", "icon", "id", "name", "port", "updatedAt") SELECT "active", "createdAt", "description", "icon", "id", "name", "port", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
