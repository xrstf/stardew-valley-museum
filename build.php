<?php

require getenv('COMPOSER_HOME').'/vendor/autoload.php';

$DB = Symfony\Component\Yaml\Yaml::parse(file_get_contents('database.yaml'));
file_put_contents('www/database.js', 'var DB = '.json_encode($DB).';');
