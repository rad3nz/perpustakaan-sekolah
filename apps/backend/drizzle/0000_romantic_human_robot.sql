CREATE TABLE `anggota` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nama` varchar(150) NOT NULL,
	`no_anggota` varchar(20) NOT NULL,
	`kelas` varchar(50) NOT NULL,
	`telepon` varchar(30),
	`aktif` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anggota_id` PRIMARY KEY(`id`),
	CONSTRAINT `anggota_no_anggota_unique` UNIQUE(`no_anggota`)
);
--> statement-breakpoint
CREATE TABLE `buku` (
	`id` int AUTO_INCREMENT NOT NULL,
	`judul` varchar(255) NOT NULL,
	`pengarang` varchar(150) NOT NULL,
	`penerbit` varchar(150),
	`tahun_terbit` int,
	`isbn` varchar(20),
	`kategori` varchar(100) NOT NULL,
	`stok` int NOT NULL DEFAULT 0,
	`stok_tersedia` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buku_id` PRIMARY KEY(`id`),
	CONSTRAINT `buku_isbn_idx` UNIQUE(`isbn`)
);
--> statement-breakpoint
CREATE TABLE `peminjaman` (
	`id` int AUTO_INCREMENT NOT NULL,
	`anggota_id` int NOT NULL,
	`buku_id` int NOT NULL,
	`tanggal_pinjam` date NOT NULL,
	`tanggal_kembali_rencana` date NOT NULL,
	`tanggal_kembali_aktual` date,
	`status` enum('dipinjam','dikembalikan') NOT NULL DEFAULT 'dipinjam',
	`denda` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `peminjaman_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nama` varchar(150) NOT NULL,
	`username` varchar(100) NOT NULL,
	`password` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `peminjaman` ADD CONSTRAINT `peminjaman_anggota_id_anggota_id_fk` FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `peminjaman` ADD CONSTRAINT `peminjaman_buku_id_buku_id_fk` FOREIGN KEY (`buku_id`) REFERENCES `buku`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `anggota_nama_idx` ON `anggota` (`nama`);--> statement-breakpoint
CREATE INDEX `buku_judul_idx` ON `buku` (`judul`);--> statement-breakpoint
CREATE INDEX `buku_kategori_idx` ON `buku` (`kategori`);--> statement-breakpoint
CREATE INDEX `peminjaman_anggota_idx` ON `peminjaman` (`anggota_id`);--> statement-breakpoint
CREATE INDEX `peminjaman_buku_idx` ON `peminjaman` (`buku_id`);--> statement-breakpoint
CREATE INDEX `peminjaman_status_idx` ON `peminjaman` (`status`);