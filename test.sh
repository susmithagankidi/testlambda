if grep 'lz_isr_fetch_user_data_function04\|dev_isr_fetch_mqa_active_alarms_per_site' file1.txt; then
cd dev_isr_fetch_mqa_active_alarms_per_site
 npm test
 cd ../lz_isr_fetch_user_data_function04
 npm test
elif  grep 'lz_isr_fetch_user_data_function04' file1.txt; then
  cd lz_isr_fetch_user_data_function04
  npm test
elif grep 'dev_isr_fetch_mqa_active_alarms_per_site' file1.txt; then
  cd dev_isr_fetch_mqa_active_alarms_per_site
  npm test
 else
	 echo "no changes to folders"
fi
