<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Pelanggaran K3 - SecVis</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Times New Roman', serif;
            font-size: 10pt;
            color: #1a1a1a;
            background: #fff;
        }

        /* ── HEADER ── */
        .header {
            border-bottom: 3px solid #1a3a6b;
            padding-bottom: 10px;
            margin-bottom: 14px;
            display: table;
            width: 100%;
        }
        .header-logo {
            display: table-cell;
            width: 60px;
            vertical-align: middle;
        }
        .header-logo-box {
            width: 48px;
            height: 48px;
            background: #1a3a6b;
            border-radius: 6px;
            text-align: center;
            line-height: 48px;
            color: white;
            font-size: 16pt;
            font-weight: bold;
            font-family: Arial, sans-serif;
        }
        .header-info {
            display: table-cell;
            vertical-align: middle;
            padding-left: 12px;
        }
        .header-info h1 {
            font-size: 13pt;
            color: #1a3a6b;
            font-weight: bold;
        }
        .header-info p {
            font-size: 8.5pt;
            color: #555;
            margin-top: 2px;
        }
        .header-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
        }
        .header-right .doc-number {
            font-size: 8pt;
            color: #888;
        }
        .header-right .doc-date {
            font-size: 8.5pt;
            color: #333;
            margin-top: 3px;
        }

        /* ── JUDUL ── */
        .report-title {
            text-align: center;
            margin: 14px 0 4px;
        }
        .report-title h2 {
            font-size: 12.5pt;
            font-weight: bold;
            color: #1a3a6b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .report-title .periode {
            font-size: 9.5pt;
            color: #444;
            margin-top: 3px;
        }
        .title-underline {
            width: 100%;
            height: 1px;
            background: #ccc;
            margin: 10px 0 14px;
        }

        /* ── INFO BOX ── */
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 16px;
            border: 1px solid #dde3ee;
            border-radius: 4px;
            background: #f7f9fc;
        }
        .info-grid-row { display: table-row; }
        .info-cell {
            display: table-cell;
            padding: 9px 14px;
            border-right: 1px solid #dde3ee;
            width: 25%;
        }
        .info-cell:last-child { border-right: none; }
        .info-cell .label {
            font-size: 7pt;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .info-cell .value {
            font-size: 10.5pt;
            font-weight: bold;
            color: #1a3a6b;
        }
        .info-cell .sub {
            font-size: 7.5pt;
            color: #666;
            margin-top: 1px;
        }

        /* ── SECTION TITLE ── */
        .section-title {
            font-size: 9pt;
            font-weight: bold;
            color: #1a3a6b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-left: 3px solid #1a3a6b;
            padding-left: 7px;
            margin: 16px 0 8px;
        }

        /* ── DISTRIBUSI TABLE ── */
        .dist-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-bottom: 0;
        }
        .dist-table th {
            background: #f0f4fa;
            color: #1a3a6b;
            padding: 7px 10px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #dde3ee;
        }
        .dist-table td {
            padding: 6px 10px;
            border: 1px solid #dde3ee;
            color: #333;
        }
        .bar-bg {
            background: #e8ecf2;
            border-radius: 3px;
            height: 7px;
            width: 100%;
        }
        .bar-fill {
            background: #1a3a6b;
            border-radius: 3px;
            height: 7px;
        }

        /* ── DISTRIBUSI 2-KOLOM ── */
        .dist-wrapper {
            display: table;
            width: 100%;
            margin-bottom: 14px;
        }
        .dist-col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .dist-col:first-child { padding-right: 8px; }
        .dist-col:last-child  { padding-left: 8px; }

        /* ── RIWAYAT TABLE ── */
        .violation-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-bottom: 16px;
        }
        .violation-table thead tr {
            background: #1a3a6b;
            color: white;
        }
        .violation-table thead th {
            padding: 7px 9px;
            text-align: left;
            font-weight: 600;
            letter-spacing: 0.2px;
        }
        .violation-table tbody tr:nth-child(even) { background: #f4f7fb; }
        .violation-table tbody tr:nth-child(odd)  { background: #ffffff; }
        .violation-table tbody td {
            padding: 5.5px 9px;
            border-bottom: 1px solid #e8ecf2;
            color: #333;
        }

        /* ── BADGE ── */
        .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 10px;
            font-size: 7.5pt;
            font-weight: 600;
        }
        .badge-helmet  { background: #fde8e8; color: #c0392b; }
        .badge-vest    { background: #e8f0fe; color: #1a3a6b; }
        .badge-boots   { background: #fef9e7; color: #b7860b; }
        .badge-gloves  { background: #fef0e7; color: #e67e22; }
        .badge-glasses { background: #eafaf1; color: #1e8449; }

        /* ── FOOTER ── */
        .footer {
            margin-top: 24px;
            border-top: 1px solid #ccc;
            padding-top: 14px;
        }
        .signature-grid { display: table; width: 100%; }
        .signature-cell {
            display: table-cell;
            width: 33%;
            text-align: center;
            padding: 0 10px;
        }
        .signature-label {
            font-size: 8.5pt;
            color: #555;
            margin-bottom: 44px;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin: 0 20px;
            padding-top: 4px;
            font-size: 8.5pt;
            color: #333;
            font-weight: bold;
        }
        .signature-role {
            font-size: 7.5pt;
            color: #777;
            margin-top: 2px;
        }
        .page-footer {
            margin-top: 16px;
            text-align: center;
            font-size: 7.5pt;
            color: #aaa;
        }
        .no-data {
            text-align: center;
            padding: 20px;
            color: #999;
            font-style: italic;
            font-size: 8.5pt;
        }
    </style>
</head>
<body>

    {{-- HEADER --}}
    <div class="header">
        <div class="header-logo">
            <div class="header-logo-box">S</div>
        </div>
        <div class="header-info">
            <h1>SecVis — Sistem Monitoring K3</h1>
            <p>PT Epson Indonesia · Area Maintenance</p>
        </div>
        <div class="header-right">
            <div class="doc-number">No. Dok: SV-LAP-{{ str_pad($nomor_laporan, 4, '0', STR_PAD_LEFT) }}</div>
            <div class="doc-date">Dicetak: {{ $tanggal_cetak }}</div>
        </div>
    </div>

    {{-- JUDUL --}}
    <div class="report-title">
        <h2>Laporan Pelanggaran K3</h2>
        <div class="periode">Periode: {{ $label_periode }}</div>
    </div>
    <div class="title-underline"></div>

    {{-- INFO RINGKASAN --}}
    <div class="info-grid">
        <div class="info-grid-row">
            <div class="info-cell">
                <div class="label">Total Pelanggaran</div>
                <div class="value">{{ $total_pelanggaran }}</div>
                <div class="sub">kejadian terdeteksi</div>
            </div>
            <div class="info-cell">
                <div class="label">Shift Terbanyak</div>
                <div class="value">{{ $shift_terbanyak['nama'] ?? '-' }}</div>
                <div class="sub">{{ $shift_terbanyak['total'] ?? 0 }} pelanggaran</div>
            </div>
            <div class="info-cell">
                <div class="label">APD Paling Dilanggar</div>
                <div class="value">{{ $apd_terbanyak['nama'] ?? '-' }}</div>
                <div class="sub">{{ $apd_terbanyak['total'] ?? 0 }} kejadian</div>
            </div>
            <div class="info-cell">
                <div class="label">Kamera Aktif</div>
                <div class="value">{{ $jumlah_kamera }}</div>
                <div class="sub">unit terpasang</div>
            </div>
        </div>
    </div>

    {{-- DISTRIBUSI 2 KOLOM BERDAMPINGAN --}}
    <div class="dist-wrapper">

        {{-- Kiri: Distribusi per Jenis --}}
        <div class="dist-col">
            <div class="section-title">Distribusi Jenis Pelanggaran</div>
            <table class="dist-table">
                <thead>
                    <tr>
                        <th>Jenis Pelanggaran</th>
                        <th style="width:60px">Jumlah</th>
                        <th style="width:60px">Persen</th>
                        <th style="width:30%">Proporsi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($by_type as $item)
                    @php
                        $labelMap = [
                            'no-helmet'  => 'Tidak Memakai Helm',
                            'no-vest'    => 'Tidak Memakai Rompi',
                            'no-boots'   => 'Tidak Memakai Sepatu Safety',
                            'no-gloves'  => 'Tidak Memakai Sarung Tangan',
                            'no-glasses' => 'Tidak Memakai Kacamata',
                        ];
                        $badgeMap = [
                            'no-helmet'  => 'badge-helmet',
                            'no-vest'    => 'badge-vest',
                            'no-boots'   => 'badge-boots',
                            'no-gloves'  => 'badge-gloves',
                            'no-glasses' => 'badge-glasses',
                        ];
                    @endphp
                    <tr>
                        <td>
                            <span class="badge {{ $badgeMap[$item['jenis']] ?? '' }}">
                                {{ $labelMap[$item['jenis']] ?? $item['jenis'] }}
                            </span>
                        </td>
                        <td><strong>{{ $item['total'] }}</strong></td>
                        <td>{{ $item['persentase'] }}%</td>
                        <td>
                            <div class="bar-bg">
                                <div class="bar-fill" style="width: {{ $item['persentase'] }}%;"></div>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr><td colspan="4" class="no-data">Tidak ada data</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{-- Kanan: Distribusi per Shift --}}
        <div class="dist-col">
            <div class="section-title">Distribusi Per Shift</div>
            <table class="dist-table">
                <thead>
                    <tr>
                        <th>Shift</th>
                        <th>Jam Operasional</th>
                        <th style="width:70px">Jumlah</th>
                        <th style="width:60px">Persen</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($by_shift as $item)
                    <tr>
                        <td><strong>{{ $item['nama_shift'] }}</strong></td>
                        <td>{{ $item['jam_mulai'] }} – {{ $item['jam_selesai'] }}</td>
                        <td>{{ $item['total'] }}</td>
                        <td>{{ $total_pelanggaran > 0 ? round(($item['total'] / $total_pelanggaran) * 100, 1) : 0 }}%</td>
                    </tr>
                    @empty
                    <tr><td colspan="4" class="no-data">Tidak ada data</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>

    </div>

    {{-- RIWAYAT PELANGGARAN --}}
    <div class="section-title">Riwayat Pelanggaran</div>
    @if(count($violations) > 0)
    <table class="violation-table">
        <thead>
            <tr>
                <th style="width:4%">No</th>
                <th style="width:16%">Waktu Deteksi</th>
                <th style="width:12%">Shift</th>
                <th style="width:11%">Kamera</th>
                <th style="width:32%">Jenis Pelanggaran</th>
                <th style="width:10%">Confidence</th>
            </tr>
        </thead>
        <tbody>
            @foreach($violations as $i => $v)
            @php
                $labelMap = [
                    'no-helmet'  => 'Tidak Memakai Helm',
                    'no-vest'    => 'Tidak Memakai Rompi',
                    'no-boots'   => 'Tidak Memakai Sepatu Safety',
                    'no-gloves'  => 'Tidak Memakai Sarung Tangan',
                    'no-glasses' => 'Tidak Memakai Kacamata',
                ];
                $badgeMap = [
                    'no-helmet'  => 'badge-helmet',
                    'no-vest'    => 'badge-vest',
                    'no-boots'   => 'badge-boots',
                    'no-gloves'  => 'badge-gloves',
                    'no-glasses' => 'badge-glasses',
                ];
            @endphp
            <tr>
                <td style="text-align:center; color:#999">{{ $i + 1 }}</td>
                <td style="font-family: monospace; font-size: 7.5pt">{{ $v['timestamp'] }}</td>
                <td>{{ $v['shift'] }}</td>
                <td style="font-family: monospace; font-size: 7.5pt">{{ $v['kamera'] }}</td>
                <td>
                    <span class="badge {{ $badgeMap[$v['jenis']] ?? '' }}">
                        {{ $labelMap[$v['jenis']] ?? $v['jenis'] }}
                    </span>
                </td>
                <td style="text-align:center; font-family: monospace; font-size: 7.5pt">{{ $v['confidence'] }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p class="no-data">Tidak ada data pelanggaran pada periode ini.</p>
    @endif

    {{-- TANDA TANGAN --}}
    <div class="footer">
        <div class="signature-grid">
            <div class="signature-cell">
                <div class="signature-label">Dibuat oleh,</div>
                <div class="signature-line">Manager</div>
                <div class="signature-role">Manager Area Maintenance</div>
            </div>
            <div class="signature-cell">
                <div class="signature-label">Diperiksa oleh,</div>
                <div class="signature-line">HR / CAO</div>
                <div class="signature-role">Human Resources / CAO</div>
            </div>
            <div class="signature-cell">
                <div class="signature-label">Disetujui oleh,</div>
                <div class="signature-line">General Manager</div>
                <div class="signature-role">General Manager PT Epson Indonesia</div>
            </div>
        </div>
        <div class="page-footer">
            Dokumen ini digenerate otomatis oleh sistem SecVis · PT Epson Indonesia · {{ $tanggal_cetak }}
        </div>
    </div>

</body>
</html>