zip:
	mkdir -p build
	zip -j build/ext.zip src/*

clean:
	rm -rf build/*
