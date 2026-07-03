-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: srims
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actorId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `before` text COLLATE utf8mb4_unicode_ci,
  `after` text COLLATE utf8mb4_unicode_ci,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_timestamp_idx` (`timestamp`),
  KEY `audit_logs_entity_entityId_idx` (`entity`,`entityId`),
  KEY `audit_logs_actorId_fkey` (`actorId`),
  CONSTRAINT `audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('cmr4ozow3000411x4u9jf617w','user-1','CREATE','Requisition','REQ-2025-00129',NULL,'{\"id\":\"REQ-2025-00129\",\"status\":\"PENDING\",\"totalAmount\":5,\"priority\":\"NORMAL\"}','2026-07-03 08:49:33.891'),('cmr4ozx1i000911x4v0iioqcv','user-1','APPROVED','Requisition','REQ-2025-00129',NULL,'{\"id\":\"REQ-2025-00129\",\"status\":\"APPROVED\"}','2026-07-03 08:49:44.454'),('cmr4p0k6n000g11x4p5va82m1','user-1','STOCK_OUTWARD','Item','ITM-0001',NULL,'Issued Ball Pen (Blue) by +1. Ref: OUT-614076 Requisition: REQ-2025-00129.','2026-07-03 08:50:14.448'),('cmr4p2jjo000j11x4sek7hdmu','user-1','APPROVED','Requisition','REQ-2025-00128',NULL,'{\"id\":\"REQ-2025-00128\",\"status\":\"APPROVED\"}','2026-07-03 08:51:46.933');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_key` (`name`),
  KEY `categories_parentId_idx` (`parentId`),
  CONSTRAINT `categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('cat-1','Writing Instruments',NULL,'PenTool','#2563EB'),('cat-2','Paper Products',NULL,'FileText','#D97706'),('cat-3','Desk Accessories',NULL,'Briefcase','#059669'),('cat-4','Files & Folders',NULL,'Folder','#CA8A04'),('cat-5','Office Electronics',NULL,'Calculator','#475569'),('cat-6','Others',NULL,'MoreHorizontal','#6B7280');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES ('dept-2','Finance'),('dept-3','HR'),('dept-5','IT'),('dept-1','Marketing'),('dept-4','Operations');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grn_items`
--

DROP TABLE IF EXISTS `grn_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grn_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grnId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receivedQty` int NOT NULL,
  `unitPrice` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `grn_items_grnId_fkey` (`grnId`),
  KEY `grn_items_itemId_fkey` (`itemId`),
  CONSTRAINT `grn_items_grnId_fkey` FOREIGN KEY (`grnId`) REFERENCES `grns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `grn_items_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grn_items`
--

LOCK TABLES `grn_items` WRITE;
/*!40000 ALTER TABLE `grn_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `grn_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grns`
--

DROP TABLE IF EXISTS `grns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grns` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grnDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `invoiceNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoiceDate` datetime(3) DEFAULT NULL,
  `deliveryChallan` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliveryDate` datetime(3) DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `totalValue` double NOT NULL DEFAULT '0',
  `attachments` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `grns_supplierId_fkey` (`supplierId`),
  CONSTRAINT `grns_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grns`
--

LOCK TABLES `grns` WRITE;
/*!40000 ALTER TABLE `grns` DISABLE KEYS */;
/*!40000 ALTER TABLE `grns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issuances`
--

DROP TABLE IF EXISTS `issuances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issuances` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requisitionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issuedById` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issuedToId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receivedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issueDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `referenceNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `issuances_referenceNo_key` (`referenceNo`),
  KEY `issuances_issuedById_fkey` (`issuedById`),
  KEY `issuances_issuedToId_fkey` (`issuedToId`),
  KEY `issuances_requisitionId_fkey` (`requisitionId`),
  CONSTRAINT `issuances_issuedById_fkey` FOREIGN KEY (`issuedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `issuances_issuedToId_fkey` FOREIGN KEY (`issuedToId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `issuances_requisitionId_fkey` FOREIGN KEY (`requisitionId`) REFERENCES `requisitions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issuances`
--

LOCK TABLES `issuances` WRITE;
/*!40000 ALTER TABLE `issuances` DISABLE KEYS */;
/*!40000 ALTER TABLE `issuances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unitPrice` double NOT NULL,
  `currentStock` int NOT NULL DEFAULT '0',
  `minStockLevel` int NOT NULL DEFAULT '10',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `iconKey` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `items_categoryId_idx` (`categoryId`),
  CONSTRAINT `items_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES ('ITM-0001','Ball Pen (Blue)','cat-1','Piece',5,15,50,1,'pen-blue'),('ITM-0002','Ball Pen (Red)','cat-1','Piece',5,120,50,1,'pen-red'),('ITM-0003','Marker (Black)','cat-1','Piece',18,5,30,1,'marker'),('ITM-0004','Pencil (HB)','cat-1','Piece',4,200,100,1,'pencil'),('ITM-0005','Highlighter (Yellow)','cat-1','Piece',15,2,25,1,'highlighter'),('ITM-0006','Stapler Pins (10 No.)','cat-3','Box',20,85,30,1,'stapler-pins'),('ITM-0007','A4 Copier Paper (70 GSM)','cat-2','Ream',210,8,20,1,'paper-a4'),('ITM-0008','Spiral Notebook (A5)','cat-2','Piece',45,65,30,1,'notebook'),('ITM-0009','File Folder','cat-4','Piece',25,45,20,1,'folder'),('ITM-0010','Eraser','cat-3','Piece',5,150,50,1,'eraser'),('ITM-0011','Gel Pen (Black)','cat-1','Piece',12,90,40,1,'pen-black'),('ITM-0012','Whiteboard Marker','cat-1','Piece',25,7,20,1,'marker-wb'),('ITM-0013','Sticky Notes (3x3)','cat-2','Pack',35,40,15,1,'sticky-notes'),('ITM-0014','Paper Clips','cat-3','Box',10,100,25,1,'clips'),('ITM-0015','Stapler','cat-3','Piece',120,12,5,1,'stapler'),('ITM-0016','Scissors','cat-3','Piece',45,18,8,1,'scissors'),('ITM-0017','Tape (Transparent)','cat-3','Roll',15,4,15,1,'tape'),('ITM-0018','Envelope (A4)','cat-2','Pack',30,55,20,1,'envelope'),('ITM-0019','Correction Pen','cat-1','Piece',20,35,15,1,'correction'),('ITM-0020','Calculator (Basic)','cat-5','Piece',250,0,5,1,'calculator'),('ITM-0021','Rubber Bands','cat-6','Pack',8,75,20,1,'rubber-bands'),('ITM-0022','Glue Stick','cat-6','Piece',15,3,10,1,'glue'),('ITM-0023','Lever Arch File','cat-4','Piece',85,6,10,1,'arch-file'),('ITM-0024','Desk Organizer','cat-3','Piece',180,0,3,1,'organizer'),('ITM-0025','USB Flash Drive (32GB)','cat-5','Piece',350,0,5,1,'usb');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `link` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_userId_isRead_idx` (`userId`,`isRead`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('cmr4ozow9000611x4aq1ezs1t','user-3','REQUISITION_PENDING','New requisition REQ-2025-00129 raised by Rahul Sharma requires approval.',0,'/approvals/pending','2026-07-03 08:49:33.897'),('cmr4ozx1l000b11x4rok1kwut','user-1','REQUISITION_APPROVED','Your requisition REQ-2025-00129 has been approved.',0,'/requisitions/my','2026-07-03 08:49:44.458'),('cmr4p2jjr000l11x4kalr7433','user-2','REQUISITION_APPROVED','Your requisition REQ-2025-00128 has been approved.',0,'/requisitions/my','2026-07-03 08:51:46.935');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `usedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_reset_tokens_token_key` (`token`),
  KEY `password_reset_tokens_token_idx` (`token`),
  KEY `password_reset_tokens_userId_fkey` (`userId`),
  CONSTRAINT `password_reset_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requisition_items`
--

DROP TABLE IF EXISTS `requisition_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisition_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requisitionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestedQty` int NOT NULL,
  `approvedQty` int NOT NULL DEFAULT '0',
  `issuedQty` int NOT NULL DEFAULT '0',
  `unitPrice` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `requisition_items_itemId_fkey` (`itemId`),
  KEY `requisition_items_requisitionId_fkey` (`requisitionId`),
  CONSTRAINT `requisition_items_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `requisition_items_requisitionId_fkey` FOREIGN KEY (`requisitionId`) REFERENCES `requisitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisition_items`
--

LOCK TABLES `requisition_items` WRITE;
/*!40000 ALTER TABLE `requisition_items` DISABLE KEYS */;
INSERT INTO `requisition_items` VALUES ('cmr4ozovz000211x4apsd8mfg','REQ-2025-00129','ITM-0001',1,1,0,5),('cmr4r8lzw000157jcn1uj7gj1','REQ-2025-00128','ITM-0001',50,0,0,5),('cmr4r8m02000357jcpxll18uo','REQ-2025-00128','ITM-0007',5,0,0,210),('cmr4r8m0k000557jcni3wajqn','REQ-2025-00127','ITM-0008',10,10,0,45),('cmr4r8m0p000757jckqcudv3n','REQ-2025-00127','ITM-0006',9,9,0,20),('cmr4r8m14000957jc7sm5heyc','REQ-2025-00126','ITM-0007',10,10,10,210),('cmr4r8m1a000b57jcxlvonh4k','REQ-2025-00126','ITM-0014',3,3,3,10),('cmr4r8m1f000d57jc6eoucnul','REQ-2025-00126','ITM-0009',1,1,1,25),('cmr4r8m1t000f57jcnvfzamhd','REQ-2025-00125','ITM-0008',10,0,0,45),('cmr4r8m1z000h57jcuclus7zr','REQ-2025-00125','ITM-0004',100,0,0,4),('cmr4r8m2d000j57jc3hu1irmp','REQ-2025-00124','ITM-0015',2,0,0,120),('cmr4r8m2h000l57jcuj6k2nus','REQ-2025-00124','ITM-0016',2,0,0,45),('cmr4r8m2l000n57jcpp8g991e','REQ-2025-00124','ITM-0019',5,0,0,20),('cmr4r8m2z000p57jck8yae0m0','REQ-2025-00123','ITM-0001',100,100,100,5),('cmr4r8m34000r57jchz5zooh3','REQ-2025-00123','ITM-0008',20,20,20,45),('cmr4r8m3a000t57jcr9cd9pk7','REQ-2025-00123','ITM-0004',30,30,30,4),('cmr4r8m3s000v57jc1mll1vic','REQ-2025-00122','ITM-0009',15,15,0,25),('cmr4r8m3x000x57jca6ljhtuc','REQ-2025-00122','ITM-0023',5,5,0,85),('cmr4r8m4b000z57jckl238yyy','REQ-2025-00121','ITM-0013',10,0,0,35),('cmr4r8m4r001157jci9rxke89','REQ-2025-00120','ITM-0020',2,2,0,250),('cmr4r8m4y001357jcpvfhqk62','REQ-2025-00120','ITM-0025',2,2,1,350),('cmr4r8m5c001557jcjp0zyx5b','REQ-2025-00119','ITM-0003',30,0,0,18),('cmr4r8m5r001757jcz9l9a4an','REQ-2025-00118','ITM-0007',2,2,2,210),('cmr4r8m67001957jc68i46vbj','REQ-2025-00117','ITM-0008',30,30,0,45),('cmr4r8m6e001b57jcyf0alqll','REQ-2025-00117','ITM-0001',30,30,0,5),('cmr4r8m6j001d57jcso8h51k9','REQ-2025-00117','ITM-0004',30,30,0,4),('cmr4r8m6y001f57jcguok66fx','REQ-2025-00116','ITM-0025',10,0,0,350),('cmr4r8m7c001h57jc0zoh7ric','REQ-2025-00115','ITM-0001',20,20,20,5),('cmr4r8m7h001j57jc8ul7r1mm','REQ-2025-00115','ITM-0011',20,20,20,12),('cmr4r8m7l001l57jcdxyistgv','REQ-2025-00115','ITM-0013',10,10,10,35),('cmr4r8m7p001n57jc4vhehc3i','REQ-2025-00115','ITM-0017',10,10,10,15),('cmr4r8m84001p57jcx4635lpd','REQ-2025-00114','ITM-0009',10,0,0,25),('cmr4r8m8i001r57jc88oputqp','REQ-2025-00113','ITM-0008',8,0,0,45),('cmr4r8m8m001t57jcwj4g44gu','REQ-2025-00113','ITM-0001',72,0,0,5),('cmr4r8m8z001v57jcrxyjvmy5','REQ-2025-00112','ITM-0001',20,20,20,5),('cmr4r8m93001x57jcvq8vqgj4','REQ-2025-00112','ITM-0005',20,20,20,15),('cmr4r8m99001z57jcaoof3cgb','REQ-2025-00112','ITM-0010',50,50,50,5),('cmr4r8m9e002157jciea0rekm','REQ-2025-00112','ITM-0006',3,3,3,20),('cmr4r8m9t002357jcvjqu264d','REQ-2025-00111','ITM-0003',5,5,0,18),('cmr4r8m9x002557jcmtovv72v','REQ-2025-00111','ITM-0017',10,10,0,15),('cmr4r8ma1002757jcbceeu1z1','REQ-2025-00111','ITM-0021',5,5,0,8);
/*!40000 ALTER TABLE `requisition_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requisitions`
--

DROP TABLE IF EXISTS `requisitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisitions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departmentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','PENDING','APPROVED','REJECTED','ISSUED','PARTIAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `purpose` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `requiredDate` datetime(3) DEFAULT NULL,
  `totalAmount` double NOT NULL DEFAULT '0',
  `priority` enum('LOW','NORMAL','URGENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMAL',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `approvedById` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `rejectedReason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `requisitions_status_idx` (`status`),
  KEY `requisitions_userId_idx` (`userId`),
  KEY `requisitions_departmentId_idx` (`departmentId`),
  KEY `requisitions_createdAt_idx` (`createdAt`),
  KEY `requisitions_approvedById_fkey` (`approvedById`),
  CONSTRAINT `requisitions_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `requisitions_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `requisitions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisitions`
--

LOCK TABLES `requisitions` WRITE;
/*!40000 ALTER TABLE `requisitions` DISABLE KEYS */;
INSERT INTO `requisitions` VALUES ('REQ-2025-00111','user-7','dept-5','APPROVED','Server Room','Labels for server room cables','2025-05-18 00:00:00.000',310,'NORMAL','2025-05-05 09:00:00.000','2026-07-03 09:52:29.623','user-3','2025-05-06 03:30:00.000',NULL),('REQ-2025-00112','user-2','dept-1','ISSUED','Office Use',NULL,'2025-05-15 00:00:00.000',880,'NORMAL','2025-05-08 03:30:00.000','2026-07-03 09:52:29.595','user-3','2025-05-08 04:30:00.000',NULL),('REQ-2025-00113','user-6','dept-3','PENDING','Recruitment Drive',NULL,'2025-06-05 00:00:00.000',720,'URGENT','2025-05-10 04:30:00.000','2026-07-03 09:52:29.577',NULL,NULL,NULL),('REQ-2025-00114','user-5','dept-2','DRAFT','Year End','Preparing for fiscal year end','2025-06-20 00:00:00.000',250,'LOW','2025-05-12 10:30:00.000','2026-07-03 09:52:29.563',NULL,NULL,NULL),('REQ-2025-00115','user-7','dept-5','ISSUED','IT Supplies',NULL,'2025-05-20 00:00:00.000',960,'NORMAL','2025-05-14 03:30:00.000','2026-07-03 09:52:29.535','user-3','2025-05-14 04:30:00.000',NULL),('REQ-2025-00116','user-2','dept-1','REJECTED','Marketing Event',NULL,'2025-05-22 00:00:00.000',3500,'LOW','2025-05-15 08:30:00.000','2026-07-03 09:52:29.520','user-3',NULL,'Duplicate request. Please check REQ-2025-00123.'),('REQ-2025-00117','user-6','dept-3','APPROVED','Workshop','Annual HR workshop','2025-06-12 00:00:00.000',1650,'NORMAL','2025-05-18 03:30:00.000','2026-07-03 09:52:29.492','user-3','2025-05-18 06:00:00.000',NULL),('REQ-2025-00118','user-5','dept-2','ISSUED','Office Use',NULL,'2025-05-25 00:00:00.000',420,'LOW','2025-05-20 05:30:00.000','2026-07-03 09:52:29.478','user-3','2025-05-20 08:30:00.000',NULL),('REQ-2025-00119','user-2','dept-1','PENDING','Marketing Campaign',NULL,'2025-06-08 00:00:00.000',540,'NORMAL','2025-05-22 03:00:00.000','2026-07-03 09:52:29.463',NULL,NULL,NULL),('REQ-2025-00120','user-7','dept-5','PARTIAL','IT Department Supplies','Some items out of stock','2025-05-30 00:00:00.000',1180,'NORMAL','2025-05-23 04:30:00.000','2026-07-03 09:52:29.441','user-3','2025-05-23 06:30:00.000',NULL),('REQ-2025-00121','user-6','dept-3','DRAFT','Office Use','Draft — reviewing quantities','2025-06-15 00:00:00.000',350,'LOW','2025-05-24 10:30:00.000','2026-07-03 09:52:29.426',NULL,NULL,NULL),('REQ-2025-00122','user-5','dept-2','APPROVED','Quarterly Audit','Required for audit documentation','2025-06-10 00:00:00.000',975,'NORMAL','2025-05-25 08:00:00.000','2026-07-03 09:52:29.405','user-3','2025-05-25 09:30:00.000',NULL),('REQ-2025-00123','user-2','dept-1','ISSUED','Event Preparation',NULL,'2025-05-28 00:00:00.000',1520,'URGENT','2025-05-26 03:30:00.000','2026-07-03 09:52:29.378','user-3','2025-05-26 05:00:00.000',NULL),('REQ-2025-00124','user-7','dept-5','REJECTED','Office Use',NULL,'2025-06-01 00:00:00.000',460,'LOW','2025-05-28 10:15:00.000','2026-07-03 09:52:29.356','user-3',NULL,'Budget exceeded for this quarter. Please resubmit next month with revised quantities.'),('REQ-2025-00125','user-6','dept-3','PENDING','Training Session','For new joiner orientation week','2025-06-07 00:00:00.000',850,'NORMAL','2025-05-29 05:30:00.000','2026-07-03 09:52:29.335',NULL,NULL,NULL),('REQ-2025-00126','user-5','dept-2','ISSUED','Office Use','Standard monthly replenishment','2025-06-01 00:00:00.000',2310,'NORMAL','2025-05-29 03:45:00.000','2026-07-03 09:52:29.310','user-3','2025-05-29 06:00:00.000',NULL),('REQ-2025-00127','user-3','dept-1','APPROVED','Monthly office supplies',NULL,'2025-06-03 00:00:00.000',630,'NORMAL','2025-05-30 08:50:00.000','2026-07-03 09:52:29.287','user-1','2025-05-30 10:30:00.000',NULL),('REQ-2025-00128','user-2','dept-1','PENDING','Marketing Campaign','Urgent requirement for upcoming event','2025-06-05 00:00:00.000',1250,'URGENT','2025-05-31 05:00:00.000','2026-07-03 09:52:29.261',NULL,NULL,NULL),('REQ-2025-00129','user-1','dept-1','APPROVED','Marketing Campaign',NULL,'2026-07-03 00:00:00.000',5,'NORMAL','2026-07-03 08:49:33.883','2026-07-03 08:49:44.445','user-1','2026-07-03 08:49:44.443',NULL);
/*!40000 ALTER TABLE `requisitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transactions`
--

DROP TABLE IF EXISTS `stock_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transactions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('INWARD','OUTWARD','ADJUSTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `unitPrice` double NOT NULL DEFAULT '0',
  `referenceNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referenceType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedRequisitionId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_transactions_itemId_idx` (`itemId`),
  KEY `stock_transactions_type_idx` (`type`),
  KEY `stock_transactions_date_idx` (`date`),
  KEY `stock_transactions_linkedRequisitionId_fkey` (`linkedRequisitionId`),
  KEY `stock_transactions_userId_fkey` (`userId`),
  CONSTRAINT `stock_transactions_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `stock_transactions_linkedRequisitionId_fkey` FOREIGN KEY (`linkedRequisitionId`) REFERENCES `requisitions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stock_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transactions`
--

LOCK TABLES `stock_transactions` WRITE;
/*!40000 ALTER TABLE `stock_transactions` DISABLE KEYS */;
INSERT INTO `stock_transactions` VALUES ('cmr4p0k6k000e11x4jnzlau4f','OUTWARD','ITM-0001',1,5,'OUT-614076','MANUAL','REQ-2025-00129','2026-07-03 08:50:14.444','user-1'),('st-1','INWARD','ITM-0007',500,210,'GRN-2025-0045','GRN',NULL,'2025-05-31 00:00:00.000','user-4'),('st-10','INWARD','ITM-0005',50,15,'GRN-2025-0041','GRN',NULL,'2025-05-25 00:00:00.000','user-4'),('st-11','OUTWARD','ITM-0005',48,15,'ISS-2025-00150','MANUAL',NULL,'2025-05-25 00:00:00.000','user-4'),('st-12','INWARD','ITM-0008',100,45,'GRN-2025-0040','GRN',NULL,'2025-05-24 00:00:00.000','user-4'),('st-13','OUTWARD','ITM-0007',20,210,'ISS-2025-00149','MANUAL',NULL,'2025-05-23 00:00:00.000','user-4'),('st-14','ADJUSTMENT','ITM-0010',-5,5,'ADJ-2025-001','MANUAL',NULL,'2025-05-22 00:00:00.000','user-4'),('st-15','INWARD','ITM-0006',100,20,'GRN-2025-0039','GRN',NULL,'2025-05-21 00:00:00.000','user-4'),('st-16','OUTWARD','ITM-0010',50,5,'ISS-2025-00148','MANUAL',NULL,'2025-05-20 00:00:00.000','user-4'),('st-17','INWARD','ITM-0011',100,12,'GRN-2025-0038','GRN',NULL,'2025-05-19 00:00:00.000','user-4'),('st-18','OUTWARD','ITM-0011',20,12,'ISS-2025-00147','MANUAL',NULL,'2025-05-19 00:00:00.000','user-4'),('st-19','INWARD','ITM-0009',50,25,'GRN-2025-0037','GRN',NULL,'2025-05-18 00:00:00.000','user-4'),('st-2','OUTWARD','ITM-0001',50,5,'ISS-2025-00155','MANUAL',NULL,'2025-05-31 00:00:00.000','user-4'),('st-20','OUTWARD','ITM-0013',10,35,'ISS-2025-00146','MANUAL',NULL,'2025-05-17 00:00:00.000','user-4'),('st-21','INWARD','ITM-0014',50,10,'GRN-2025-0036','GRN',NULL,'2025-05-16 00:00:00.000','user-4'),('st-22','OUTWARD','ITM-0017',10,15,'ISS-2025-00145','MANUAL',NULL,'2025-05-15 00:00:00.000','user-4'),('st-23','INWARD','ITM-0015',10,120,'GRN-2025-0035','GRN',NULL,'2025-05-14 00:00:00.000','user-4'),('st-24','OUTWARD','ITM-0001',20,5,'ISS-2025-00144','MANUAL',NULL,'2025-05-13 00:00:00.000','user-4'),('st-25','INWARD','ITM-0002',150,5,'GRN-2025-0034','GRN',NULL,'2025-05-12 00:00:00.000','user-4'),('st-26','OUTWARD','ITM-0006',15,20,'ISS-2025-00143','MANUAL',NULL,'2025-05-11 00:00:00.000','user-4'),('st-27','INWARD','ITM-0013',30,35,'GRN-2025-0033','GRN',NULL,'2025-05-10 00:00:00.000','user-4'),('st-28','ADJUSTMENT','ITM-0024',-2,180,'ADJ-2025-002','MANUAL',NULL,'2025-05-09 00:00:00.000','user-4'),('st-29','INWARD','ITM-0016',20,45,'GRN-2025-0032','GRN',NULL,'2025-05-08 00:00:00.000','user-4'),('st-3','INWARD','ITM-0003',100,18,'GRN-2025-0044','GRN',NULL,'2025-05-30 00:00:00.000','user-4'),('st-30','OUTWARD','ITM-0002',30,5,'ISS-2025-00142','MANUAL',NULL,'2025-05-07 00:00:00.000','user-4'),('st-4','OUTWARD','ITM-0008',25,45,'ISS-2025-00154','MANUAL',NULL,'2025-05-30 00:00:00.000','user-4'),('st-5','OUTWARD','ITM-0009',30,25,'ISS-2025-00153','MANUAL',NULL,'2025-05-29 00:00:00.000','user-4'),('st-6','INWARD','ITM-0001',200,5,'GRN-2025-0043','GRN',NULL,'2025-05-28 00:00:00.000','user-4'),('st-7','INWARD','ITM-0004',500,4,'GRN-2025-0042','GRN',NULL,'2025-05-27 00:00:00.000','user-4'),('st-8','OUTWARD','ITM-0004',100,4,'ISS-2025-00152','MANUAL',NULL,'2025-05-27 00:00:00.000','user-4'),('st-9','OUTWARD','ITM-0001',100,5,'ISS-2025-00151','MANUAL',NULL,'2025-05-26 00:00:00.000','user-4');
/*!40000 ALTER TABLE `stock_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES ('sup-1','ABC Stationery Suppliers','+91 98765 43210','12, MG Road, Kolkata 700001'),('sup-2','Delhi Office Supplies Pvt. Ltd.','+91 98765 43211','45, Connaught Place, New Delhi 110001'),('sup-3','Sharma Trading Co.','+91 98765 43212','78, Park Street, Kolkata 700016');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','USER','APPROVER','INVENTORY_MGR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `departmentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `approverId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `avatarUrl` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_departmentId_idx` (`departmentId`),
  KEY `users_approverId_fkey` (`approverId`),
  CONSTRAINT `users_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('system-auto-approval','Auto-Approval System','system-auto-approval@srims.internal','$2b$10$0AVyYXVk1RUeifyAMzsNk.z7AyEPzQudHtzhKD0rRSHG33lvk/Ava','ADMIN','dept-1',NULL,0,NULL),('user-1','Rahul Sharma','rahul@srims.com','$2b$10$..tPQKlMuUucw5pAecp2ZOlJuQcJA4nBsJu4vaMYqWH7gbNFTRtoK','ADMIN','dept-1',NULL,1,NULL),('user-2','Priya Singh','priya@srims.com','$2b$10$Nm0QvcJDhAmY04yhEAjMzu6iK5qKJlaJV3vDeY/ls9MbY3nrObsL.','USER','dept-1','user-3',1,NULL),('user-3','Amit Verma','amit@srims.com','$2b$10$zPydgNywphce3JrZcXZZ.OT85GYPivdEIVOyahTy4c8/kFt7f5QFC','APPROVER','dept-1',NULL,1,NULL),('user-4','Sandeep Kumar','sandeep@srims.com','$2b$10$4Q9OxO7KpWjuvxODJGBeseVVoAyi8gTYeI9qPp7wG64cp3kSApfpi','INVENTORY_MGR','dept-4',NULL,1,NULL),('user-5','Neha Gupta','neha@srims.com','$2b$10$lwOgawyTgOBT7m4pb0k6nuQyXGtJ8S9c08rSqobYOjtK2NNDNUgY.','USER','dept-2','user-3',1,NULL),('user-6','Rohit Kumar','rohit@srims.com','$2b$10$CiYTgxQ.aiHTl5l6fIXcR.MNEhfR3rzLfYnFn4lJTntN6ztGD8iQy','USER','dept-3','user-3',1,NULL),('user-7','Sneha Iyer','sneha@srims.com','$2b$10$1D6VucWy3wqo.mhb4u8NvuSqlBYnSxiJjzEkRs/kNH83lvQGZ/pp2','USER','dept-5','user-3',1,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-03  9:58:18
