npm run build

scp -r www/* john.delacruz@172.18.10.10:/var/www/inspeccionessst/frontend/www/


php artisan inspecciones:clean-duplicates --dry-run --purge-trashed
php artisan inspecciones:clean-duplicates --purge-trashed

OPTIMIZE TABLE inspeccion_areas, inspeccion_inspectores;