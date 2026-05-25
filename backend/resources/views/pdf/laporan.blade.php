<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Pelanggaran K3 - SecVis</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9pt;
    color: #111;
    background: #fff;
    line-height: 1.4;
    padding: 0 18px;
  }

  /* ─── HEADER ─── */
  .header {
    display: table;
    width: 100%;
    padding-bottom: 10px;
    border-bottom: 2px solid #111;
    margin-bottom: 10px;
  }
  .h-logo-left  { display: table-cell; width: 80px; vertical-align: middle; }
  .h-logo-right { display: table-cell; width: 100px; vertical-align: middle; text-align: right; }
  .h-center     { display: table-cell; vertical-align: middle; text-align: center; padding: 0 12px; }

  .logo-secvis { height: 38px; width: auto; }
  .logo-epson  { height: 32px; width: auto; }

  .h-center h1    { font-size: 11pt; color: #111; font-weight: bold; }
  .h-center .sub  { font-size: 8pt; color: #555; margin-top: 2px; }
  .h-center .meta { font-size: 7.5pt; color: #777; margin-top: 3px; }

  /* ─── JUDUL ─── */
  .report-title { text-align: center; margin: 10px 0 6px; }
  .report-title h2 { font-size: 12pt; font-weight: bold; color: #111; text-transform: uppercase; letter-spacing: 0.8px; }
  .report-title .periode { font-size: 9pt; color: #444; margin-top: 2px; }
  .title-divider { border: none; border-top: 1px solid #bbb; margin: 8px 0 10px; }

  /* ─── INFO BOX ─── */
  .info-box { display: table; width: 100%; border: 1px solid #bbb; margin-bottom: 12px; }
  .info-row  { display: table-row; }
  .info-cell {
    display: table-cell; padding: 8px 12px;
    border-right: 1px solid #bbb; width: 25%; vertical-align: middle;
  }
  .info-cell:last-child { border-right: none; }
  .info-cell .lbl { font-size: 6.5pt; color: #777; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; font-weight: bold; }
  .info-cell .val { font-size: 14pt; font-weight: bold; color: #111; line-height: 1.1; }
  .info-cell .sub { font-size: 7pt; color: #666; margin-top: 1px; }

  /* ─── SECTION TITLE ─── */
  .sec-title {
    font-size: 8pt; font-weight: bold; color: #111;
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 10px 0 6px;
  }

  /* ─── DISTRIBUSI ─── */
  .dist-wrap { display: table; width: 100%; margin-bottom: 10px; }
  .dist-col  { display: table-cell; width: 50%; vertical-align: top; }
  .dist-col:first-child { padding-right: 7px; }
  .dist-col:last-child  { padding-left:  7px; }

  .dist-tbl { width: 100%; border-collapse: collapse; font-size: 8pt; }
  .dist-tbl th { background: #eee; color: #111; padding: 5px 8px; text-align: left; font-weight: bold; border: 1px solid #bbb; font-size: 7.5pt; }
  .dist-tbl td { padding: 5px 8px; border: 1px solid #ccc; color: #222; vertical-align: middle; }
  .dist-tbl tr:nth-child(even) td { background: #f7f7f7; }

  /* Progress bar */
  .bar-bg   { background: #ddd; border-radius: 3px; height: 6px; width: 100%; }
  .bar-fill { background: #555; border-radius: 3px; height: 6px; }

  /* ─── TABEL RIWAYAT ─── */
  .vio-tbl { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
  .vio-tbl thead tr { background: #333; color: #fff; }
  .vio-tbl thead th { padding: 6px 8px; text-align: left; font-weight: bold; border: 1px solid #333; }
  .vio-tbl tbody tr:nth-child(even) { background: #f5f5f5; }
  .vio-tbl tbody tr:nth-child(odd)  { background: #fff; }
  .vio-tbl tbody td { padding: 4.5px 8px; border-bottom: 1px solid #ddd; color: #222; vertical-align: middle; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }

  /* ─── FOOTER ─── */
  .footer { margin-top: 16px; border-top: 1px solid #bbb; padding-top: 10px; }
  .sig-grid { display: table; width: 100%; }
  .sig-cell { display: table-cell; width: 33.33%; text-align: center; padding: 0 12px; }
  .sig-lbl  { font-size: 8pt; color: #555; margin-bottom: 36px; }
  .sig-line { border-top: 1px solid #333; margin: 0 16px; padding-top: 3px; font-size: 8pt; font-weight: bold; color: #111; }
  .sig-role { font-size: 7pt; color: #777; margin-top: 2px; }
  .page-note { margin-top: 12px; text-align: center; font-size: 7pt; color: #aaa; }

  .no-data { text-align: center; padding: 16px; color: #aaa; font-style: italic; font-size: 8pt; }
  .mono    { font-family: 'Courier New', Courier, monospace; }
  .center  { text-align: center; }
  .bold    { font-weight: bold; }
</style>
</head>
<body>

{{-- HEADER --}}
<div class="header">
  {{-- Logo SecVis (kiri) --}}
  <div class="h-logo-left">
    @if(file_exists(public_path('images/logo-secvis.png')))
      <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('images/logo-secvis.png'))) }}" class="logo-secvis" alt="SecVis">
    @else
      <span style="font-size:14pt;font-weight:bold;color:#003399;font-family:Arial">SecVis</span>
    @endif
  </div>

  {{-- Judul tengah --}}
  <div class="h-center">
    <h1>Sistem Monitoring K3 — SecVis</h1>
    <div class="sub">PT Indonesia Epson Industry</div>
    <div class="meta">No. Dok: SV-LAP-{{ str_pad($nomor_laporan, 4, '0', STR_PAD_LEFT) }} &nbsp;|&nbsp; Dicetak: {{ $tanggal_cetak }}</div>
  </div>

  {{-- Logo Epson (kanan) --}}
  <div class="h-logo-right">
    @if(file_exists(public_path('images/logo-epson.png')))
      <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('images/logo-epson.png'))) }}" class="logo-epson" alt="Epson">
    @else
      <span style="font-size:12pt;font-weight:bold;color:#003399;font-family:Arial">EPSON</span>
    @endif
  </div>
</div>

{{-- JUDUL --}}
<div class="report-title">
  <h2>Laporan Pelanggaran K3</h2>
  <div class="periode">Periode: {{ $label_periode }}</div>
</div>
<hr class="title-divider">

{{-- INFO BOX --}}
<div class="info-box">
  <div class="info-row">
    <div class="info-cell">
      <div class="lbl">Total Pelanggaran</div>
      <div class="val">{{ $total_pelanggaran }}</div>
      <div class="sub">kejadian terdeteksi</div>
    </div>
    <div class="info-cell">
      <div class="lbl">Shift Terbanyak</div>
      <div class="val">{{ $shift_terbanyak['nama'] ?? '—' }}</div>
      <div class="sub">{{ $shift_terbanyak['total'] ?? 0 }} pelanggaran</div>
    </div>
    <div class="info-cell">
      <div class="lbl">APD Paling Dilanggar</div>
      <div class="val">{{ $apd_terbanyak['nama'] ?? '—' }}</div>
      <div class="sub">{{ $apd_terbanyak['total'] ?? 0 }} kejadian</div>
    </div>
    <div class="info-cell">
      <div class="lbl">Kamera Aktif</div>
      <div class="val">{{ $jumlah_kamera }}</div>
      <div class="sub">unit terpasang</div>
    </div>
  </div>
</div>

{{-- DISTRIBUSI --}}
<div class="dist-wrap">
  <div class="dist-col">
    <div class="sec-title">Distribusi Jenis Pelanggaran</div>
    <table class="dist-tbl">
      <thead>
        <tr>
          <th>Jenis Pelanggaran</th>
          <th style="width:46px">Jml</th>
          <th style="width:46px">Persen</th>
          <th style="width:22%">Proporsi</th>
        </tr>
      </thead>
      <tbody>
        @php
          $labelMap = [
            'no-helmet'  => 'Tidak Memakai Helm',
            'no-vest'    => 'Tidak Memakai Rompi',
            'no-boots'   => 'Tidak Memakai Sepatu Safety',
            'no-gloves'  => 'Tidak Memakai Sarung Tangan',
            'no-glasses' => 'Tidak Memakai Kacamata',
          ];
        @endphp
        @forelse($by_type as $item)
          <tr>
            <td>{{ $labelMap[$item['jenis']] ?? $item['jenis'] }}</td>
            <td class="center bold">{{ $item['total'] }}</td>
            <td class="center">{{ $item['persentase'] }}%</td>
            <td>
              <div class="bar-bg">
                <div class="bar-fill" style="width: {{ $item['persentase'] }}%"></div>
              </div>
            </td>
          </tr>
        @empty
          <tr><td colspan="4" class="no-data">Tidak ada data</td></tr>
        @endforelse
      </tbody>
    </table>
  </div>

  <div class="dist-col">
    <div class="sec-title">Distribusi Per Shift</div>
    <table class="dist-tbl">
      <thead>
        <tr>
          <th>Shift</th>
          <th>Jam Operasional</th>
          <th style="width:46px" class="center">Jml</th>
          <th style="width:46px" class="center">Persen</th>
        </tr>
      </thead>
      <tbody>
        @forelse($by_shift as $item)
          <tr>
            <td class="bold">{{ $item['nama_shift'] }}</td>
            <td class="mono">{{ $item['jam_mulai'] }} s/d {{ $item['jam_selesai'] }}</td>
            <td class="center bold">{{ $item['total'] }}</td>
            <td class="center">
              {{ $total_pelanggaran > 0 ? round(($item['total'] / $total_pelanggaran) * 100, 1) : 0 }}%
            </td>
          </tr>
        @empty
          <tr><td colspan="4" class="no-data">Tidak ada data</td></tr>
        @endforelse
      </tbody>
    </table>
  </div>
</div>

{{-- RIWAYAT --}}
<div class="sec-title">Riwayat Pelanggaran</div>
@if(count($violations) > 0)
  @php
    $labelMap = [
      'no-helmet'  => 'Tidak Memakai Helm',
      'no-vest'    => 'Tidak Memakai Rompi',
      'no-boots'   => 'Tidak Memakai Sepatu Safety',
      'no-gloves'  => 'Tidak Memakai Sarung Tangan',
      'no-glasses' => 'Tidak Memakai Kacamata',
    ];
  @endphp
  <table class="vio-tbl">
    <thead>
      <tr>
        <th style="width:3%;text-align:center">No</th>
        <th style="width:{{ $include_foto ? '13%' : '15%' }}">Waktu Deteksi</th>
        <th style="width:9%">Shift</th>
        <th style="width:8%">Kamera</th>
        <th style="width:{{ $include_foto ? '30%' : '38%' }}">Jenis Pelanggaran</th>
        <th style="width:8%;text-align:center">Confidence</th>
        @if($include_foto)
          <th style="width:14%;text-align:center">Foto Bukti</th>
        @endif
      </tr>
    </thead>
    <tbody>
      @foreach($violations as $i => $v)
        <tr>
          <td class="center" style="color:#999">{{ $i + 1 }}</td>
          <td class="mono" style="font-size:7pt">{{ $v['timestamp'] }}</td>
          <td>{{ $v['shift'] }}</td>
          <td class="mono" style="font-size:7pt">{{ $v['kamera'] }}</td>
          <td>{{ $labelMap[$v['jenis']] ?? $v['jenis'] }}</td>
          <td class="center mono" style="font-size:7pt">{{ $v['confidence'] }}%</td>
          @if($include_foto)
            <td class="center" style="padding:4px">
              @php
                $fotoPath = $v['foto_bukti'] ? storage_path('app/public/' . $v['foto_bukti']) : null;
                $fotoAlt  = $v['foto_bukti'] ? public_path($v['foto_bukti']) : null;
                $fotoFile = ($fotoPath && file_exists($fotoPath)) ? $fotoPath : (($fotoAlt && file_exists($fotoAlt)) ? $fotoAlt : null);
              @endphp
              @if($fotoFile)
                <img src="data:image/jpeg;base64,{{ base64_encode(file_get_contents($fotoFile)) }}"
                     style="height:52px;width:auto;border-radius:3px;object-fit:cover;" alt="foto">
              @else
                <span style="font-size:7pt;color:#bbb">Tidak tersedia</span>
              @endif
            </td>
          @endif
        </tr>
      @endforeach
    </tbody>
  </table>
@else
  <p class="no-data">Tidak ada data pelanggaran pada periode ini.</p>
@endif

{{-- TANDA TANGAN --}}
<div class="footer">
  <div class="sig-grid">
    <div class="sig-cell">
      <div class="sig-lbl">Dibuat oleh,</div>
      <div class="sig-line">Manager</div>
      <div class="sig-role">Manager Area Maintenance</div>
    </div>
    <div class="sig-cell">
      <div class="sig-lbl">Diperiksa oleh,</div>
      <div class="sig-line">HR / CAO</div>
      <div class="sig-role">Human Resources / CAO</div>
    </div>
    <div class="sig-cell">
      <div class="sig-lbl">Disetujui oleh,</div>
      <div class="sig-line">General Manager</div>
      <div class="sig-role">General Manager PT Epson Indonesia</div>
    </div>
  </div>
  <div class="page-note">
    Dokumen ini digenerate otomatis oleh sistem SecVis &middot; PT Indonesia Epson Industry &middot; {{ $tanggal_cetak }}
  </div>
</div>

</body>
</html>