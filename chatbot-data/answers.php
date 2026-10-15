<?php
// ASPPS chatbot: gives the bot its answers.
// Combines (1) answers.json and (2) every row of unanswered.csv where you typed something in "your_answer".
// Only ANSWERED rows are exposed; the unanswered questions stay private.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$items = [];

// 1) answers.json (optional, for answers you write by hand)
$jsonFile = __DIR__ . '/answers.json';
if (is_file($jsonFile)) {
    $d = json_decode(file_get_contents($jsonFile), true);
    $list = is_array($d) ? (isset($d['items']) ? $d['items'] : $d) : [];
    foreach ($list as $it) {
        if (!is_array($it) || !isset($it['q'], $it['a'])) continue;
        if (isset($it['active']) && $it['active'] === false) continue;
        $items[] = ['q' => (string)$it['q'], 'k' => (string)($it['k'] ?? ''), 'a' => (string)$it['a']];
    }
}

// 2) answers typed into unanswered.csv  (columns: first_asked,last_asked,times_asked,question,your_answer,keywords)
$csvFile = __DIR__ . '/unanswered.csv';
if (is_file($csvFile) && ($fh = fopen($csvFile, 'r'))) {
    flock($fh, LOCK_SH);
    $first = true;
    while (($r = fgetcsv($fh, 0, ',', '"', '')) !== false) {
        if ($first) { $first = false; continue; }                    // header row
        $q = trim($r[3] ?? '');
        $a = trim($r[4] ?? '');
        if ($q === '' || $a === '') continue;                         // not answered yet
        $items[] = ['q' => $q, 'k' => trim($r[5] ?? ''), 'a' => $a];
    }
    flock($fh, LOCK_UN);
    fclose($fh);
}

echo json_encode(['items' => $items], JSON_UNESCAPED_UNICODE);
