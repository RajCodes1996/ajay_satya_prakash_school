<?php
// ASPPS chatbot: saves questions the bot could not answer into unanswered.csv
// Upload this file to the same folder as answers.json (e.g. /chatbot-data/).
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');

$FILE     = __DIR__ . '/unanswered.csv';
$MAX_ROWS = 3000;                       // spam safety cap

// Health check: the bot opens this URL first to know logging is available
if ($_SERVER['REQUEST_METHOD'] === 'GET')  { echo 'ok'; exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

// Accept requests from your own website only
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    $thisHost   = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
    if ($originHost !== $thisHost) { http_response_code(403); exit; }
}

// Works even on hosts without the mbstring extension
function u_len($t)        { return function_exists('mb_strlen') ? mb_strlen($t, 'UTF-8') : preg_match_all('/./su', $t); }
function u_sub($t, $n)    { return function_exists('mb_substr') ? mb_substr($t, 0, $n, 'UTF-8') : implode('', array_slice(preg_split('//u', $t, -1, PREG_SPLIT_NO_EMPTY), 0, $n)); }
function u_lower($t)      { return function_exists('mb_strtolower') ? mb_strtolower($t, 'UTF-8') : strtolower($t); }

$data = json_decode(file_get_contents('php://input', false, null, 0, 2000), true);
$q = (is_array($data) && isset($data['q'])) ? trim((string)$data['q']) : '';
$q = preg_replace('/\s+/u', ' ', $q);
if (u_len($q) < 3) { echo 'skip'; exit; }
$q = u_sub($q, 300);

function qkey($t) { return u_lower(preg_replace('/[?!.,;:"\']+/u', '', $t)); }
$key  = qkey($q);
$safe = preg_match('/^[=+\-@]/', $q) ? "'" . $q : $q;     // block Excel formula injection
$BOM  = "\xEF\xBB\xBF";                                   // lets Excel show Hindi correctly
$header = ['first_asked', 'last_asked', 'times_asked', 'question', 'your_answer', 'keywords'];

$fh = fopen($FILE, 'c+');
if (!$fh) { http_response_code(500); exit; }
flock($fh, LOCK_EX);

$rows = [];
while (($r = fgetcsv($fh, 0, ',', '"', '')) !== false) { $rows[] = $r; }
if ($rows && isset($rows[0][0])) { $rows[0][0] = preg_replace('/^\xEF\xBB\xBF/', '', $rows[0][0]); }
if (!$rows) { $rows[] = $header; }

$now = date('Y-m-d H:i');
$found = false;
for ($i = 1; $i < count($rows); $i++) {
    if (isset($rows[$i][3]) && qkey($rows[$i][3]) === $key) {   // same question again: just count it
        $rows[$i][1] = $now;
        $rows[$i][2] = (int)($rows[$i][2] ?? 1) + 1;
        $found = true;
        break;
    }
}
if (!$found) {
    if (count($rows) > $MAX_ROWS) { flock($fh, LOCK_UN); fclose($fh); echo 'full'; exit; }
    $rows[] = [$now, $now, 1, $safe, '', ''];
}

rewind($fh);
ftruncate($fh, 0);
fwrite($fh, $BOM);
foreach ($rows as $r) { fputcsv($fh, $r, ',', '"', ''); }
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);
echo 'saved';
