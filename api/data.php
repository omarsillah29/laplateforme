<?php

function getDatabase() {
    $db_file = '../data/database.json';
    if (!file_exists($db_file)) {
        file_put_contents($db_file, json_encode(["users" => [], "requests" => []], JSON_PRETTY_PRINT));
    }
    $json_data = file_get_contents($db_file);
    return json_decode($json_data, true);
}

function saveDatabase($db) {
    $db_file = '../data/database.json';
    file_put_contents($db_file, json_encode($db, JSON_PRETTY_PRINT));
}

// Handle CORS for development (optional: you can allow only localhost)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

$db = getDatabase();
$type = $_GET['type'] ?? null;

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if ($type === 'users') {
            echo json_encode($db['users']);
            exit();
        } elseif ($type === 'requests') {
            echo json_encode($db['requests']);
            exit();
        } else {
            echo json_encode($db);
            exit();
        }
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if ($type === 'requests') {
            // Add presence request
            $newId = count($db['requests']) > 0 ? max(array_column($db['requests'], 'id')) + 1 : 1;
            $input['id'] = $newId;
            $db['requests'][] = $input;
            saveDatabase($db);
            echo json_encode(['success' => true, 'request' => $input]);
            exit();
        } elseif ($type === 'users') {
            // Add new user (should be rare outside registration)
            $db['users'][] = $input;
            saveDatabase($db);
            echo json_encode(['success' => true, 'user' => $input]);
            exit();
        }
        break;
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if ($type === 'requests' && isset($input['id'])) {
            foreach ($db['requests'] as &$req) {
                if ($req['id'] == $input['id']) {
                    $req = array_merge($req, $input);
                }
            }
            saveDatabase($db);
            echo json_encode(['success' => true]);
            exit();
        } elseif ($type === 'users' && isset($input['email'])) {
            foreach ($db['users'] as &$user) {
                if ($user['email'] == $input['email']) {
                    $user = array_merge($user, $input);
                }
            }
            saveDatabase($db);
            echo json_encode(['success' => true]);
            exit();
        }
        break;
    case 'DELETE':
        parse_str(file_get_contents('php://input'), $input);
        if ($type === 'requests' && isset($input['id'])) {
            $db['requests'] = array_filter($db['requests'], function($r) use ($input) {
                return $r['id'] != $input['id'];
            });
            saveDatabase($db);
            echo json_encode(['success' => true]);
            exit();
        } elseif ($type === 'users' && isset($input['email'])) {
            $db['users'] = array_filter($db['users'], function($u) use ($input) {
                return $u['email'] != $input['email'];
            });
            // Optionally delete associated requests as well
            if (isset($input['cascade']) && $input['cascade']) {
                $db['requests'] = array_filter($db['requests'], function($r) use ($input) {
                    return $r['user'] != $input['email'];
                });
            }
            saveDatabase($db);
            echo json_encode(['success' => true]);
            exit();
        }
}

echo json_encode(['error' => 'Bad Request']);
http_response_code(400);
