<?php
$mysqli = new mysqli("localhost", "root", "", "test"); 
if ($mysqli->connect_errno) {
    printf("Connection failed: %s \n", $mysqli->connect_error);
    exit();
}


if (!function_exists('json_decode')) {
    function json_decode($content, $assoc=false) {
        require_once 'classes/JSON.php';
        if ($assoc) {
            $json = new Services_JSON(SERVICES_JSON_LOOSE_TYPE);
        }
        else {
            $json = new Services_JSON;
        }
        return $json->decode($content);
    }
}


function response($stmt, array $a_params, $types, array $errors_msg){
     $bind_names[] = $types;
     for ($i=0; $i<count($a_params);$i++) 
     {
        $bind_name = 'bind' . $i;
        $$bind_name = $a_params[$i];
        $bind_names[] = &$$bind_name;
     }  
    if ($stmt) {
        #$stmt->bind_param("sss", $val['comment'],$val['img'],$val['link']);
        call_user_func_array(array($stmt, 'bind_param'), $bind_names);
        $stmt->execute();
        if (isset($stmt->affected_rows) && $stmt->affected_rows != -1)  {
            $resp  = array("result" => "true", "error" => "");
        } else{
            $resp = array("result" => "", "error" => $errors_msg[0]);       
        }                   
    } else {
        $resp = array("result" => "", "error" => $errors_msg[1]);
    }
    return $resp;
}


if (isset($_GET['act'])) {
    switch ($_GET['act']) {
        case 'get_files_list':
            if ($handle = opendir('files')) {
                $resp = array();
                while (false !== ($entry = readdir($handle))) {
                    if($entry != "." && $entry != "..") $resp[] = $entry;
                }

                closedir($handle);
                echo json_encode($resp);
            }       
            break;
        case 'get_slides_data':
            $resp = array();    
            $line = array();
            $res = $mysqli->query("SELECT * FROM slider");
            while($obj = $res->fetch_object()){  
                $line['number'] = $obj->id; 
                $line['comment'] = $obj->comment; 
                $line['img'] = $obj->img;
                $line['link'] = $obj->link;
                $resp[] = $line; 
            }   
            echo json_encode($resp);
            break;
        case 'hide_or_show':
            $res = $mysqli->query('SELECT hide FROM slider_meta WHERE id=1');
            $resp = [];
            while($obj = $res->fetch_object()){  
                $resp['hide'] = $obj->hide;
            }   
            echo json_encode($resp);

    }
}
if (isset($_POST['file_upload'])) {
    $uploaddir = 'files/';
    foreach ($_FILES['photos']['name'] as $key => $value) {
        $name = $value;
        $tmp_name = $_FILES['photos']['tmp_name'][$key];
        move_uploaded_file($tmp_name,$uploaddir.$name);
    }
}
if(isset($_POST['save'])){
    $mysqli->query('TRUNCATE TABLE slider');
        foreach ($_POST as $key => $val) {
            if($key != 'save'){
                $stmt = $mysqli->prepare("INSERT INTO slider (comment,img,link) VALUES (?,?,?)");
                $resp = response($stmt,array($val['comment'],$val['img'],$val['link']),'sss',array("Save error!","Save query error !"));

            }               
        }
        echo json_encode($resp);
}
if(isset($_POST['hide'])){
    $res = $mysqli->query('SELECT * from slider_meta');
    if ($res->num_rows === 0){
        $stmt = $mysqli->prepare('INSERT INTO slider_meta (id,hide) VALUES (1,?)');
        $resp = response($stmt,array($_POST['hide']),'s',array("Insert hide error!","Hide query error!"));          
    } else{
        $stmt = $mysqli->prepare("UPDATE slider_meta SET hide = ? WHERE id=1");
        $resp = response($stmt,array($_POST['hide']),'s',array("Update hide error!","Hide query error!"));          
    }
    echo json_encode($resp);
}