<?php
$mysqli = new mysqli("localhost", "root", "", "test");
if ($mysqli->connect_errno) {
    printf("Connection failed: %s \n", $mysqli->connect_error);
    exit();
}

define('FILE_DIR', '../files/');

function response($stmt, array $a_params, $types, array $errors_msg){
     $bind_names[] = $types;
     for ($i=0; $i<count($a_params);$i++)
     {
        $bind_name = 'bind' . $i;
        $$bind_name = $a_params[$i];
        $bind_names[] = &$$bind_name;
     }
    if ($stmt) {
        call_user_func_array(array($stmt, 'bind_param'), $bind_names);
        $stmt->execute();
        if (@$stmt->affected_rows != -1)  {
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
            $filedir = FILE_DIR ;
            if ($handle = opendir($filedir)) {
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
            $resp = array();
            if ($res->num_rows === 0){
                $mysqli->query('INSERT INTO slider_meta (id,hide) VALUES (1,0)');
                $resp['hide'] = 0;
            } else{
                while($obj = $res->fetch_object()){
                    $resp['hide'] = $obj->hide;
                }
            }
            echo json_encode($resp);
            break;

    }
}
if (isset($_POST['file_upload'])) {
    $uploaddir = FILE_DIR;
    foreach ($_FILES['photos']['name'] as $key => $value) {
        $name = $value;
        $tmp_name = $_FILES['photos']['tmp_name'][$key];
        $path = $uploaddir.$name;
        if(is_writable($uploaddir)){
            move_uploaded_file($tmp_name,$path);
        } else{
            echo json_encode(array('result'=>'false','error'=>'File folder permission denied!'));
        }
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
