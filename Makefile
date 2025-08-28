### ==== CONFIG ====
generator := typescript-node
openapi-generator-version := 5.4.0
openapi-generator-url := https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/$(openapi-generator-version)/openapi-generator-cli-$(openapi-generator-version).jar
openapi-generator-jar := build/openapi-generator-cli.jar
openapi-generator-cli := java -jar $(openapi-generator-jar)

spec_repo := https://github.com/Adyen/adyen-openapi.git
spec_commit := main
specs_dir := build/spec/json

services := checkout payment payout
singleFileServices := disputes balanceControl

### ==== TASKS ====

## 1 — Check required tools
check-deps:
	@for dep in java wget jq perl npx; do \
		command -v $$dep >/dev/null || { echo "Missing: $$dep"; exit 1; }; \
	done

## 2 — Download OpenAPI Generator JAR (cached)
$(openapi-generator-jar): | build
	wget -q $(openapi-generator-url) -O $(openapi-generator-jar)

build:
	mkdir -p build

## 3 — Fetch & pin specs
fetch-specs: | build
	rm -rf build/spec
	git clone --depth 1 --branch $(spec_commit) $(spec_repo) build/spec
	perl -i -pe's/"openapi" : "3.[0-9].[0-9]"/"openapi" : "3.0.0"/' $(specs_dir)/*.json

## 4 — Generate multi‑file services
$(services): $(openapi-generator-jar) check-deps fetch-specs
	rm -rf build/model src/typings/$@ src/services/$@
	$(openapi-generator-cli) generate \
		-i $(specs_dir)/$@.json \
		-g $(generator) \
		-t templates/typescript \
		-o build \
		--skip-validate-spec \
		--api-package $@ \
		--api-name-suffix Service \
		--global-property models,apis \
		--additional-properties=modelPropertyNaming=original,serviceName=$@
	mkdir -p src/services/$@
	mv build/$@/*Api.ts src/services/$@/
	mv -f build/model src/typings/$@
	npx eslint --fix ./src/services/$@/*.ts

## 5 — Generate single‑file services
$(singleFileServices): $(openapi-generator-jar) check-deps fetch-specs
	rm -rf src/typings/$@ build/model src/services/$@
	jq -e 'del(.paths[][].tags)' $(specs_dir)/$@.json > $(specs_dir)/$@.tmp
	mv $(specs_dir)/$@.tmp $(specs_dir)/$@.json
	$(openapi-generator-cli) generate \
		-i $(specs_dir)/$@.json \
		-g $(generator) \
		-o build \
		--skip-validate-spec \
		--api-package $@ \
		--api-name-suffix Service \
		--global-property models,apis \
		--additional-properties=modelPropertyNaming=original,serviceName=$@
	mv build/$@/*Root.ts src/services/$@Api.ts
	mv -f build/model src/typings/$@
	npx eslint --fix ./src/services/$@Api.ts

## 6 — Full build
services: $(services) $(singleFileServices)
	@echo "✅ All services generated successfully."

## 7 — Type check
type-check:
	npx tsc --noEmit

## 8 — Clean
clean:
	rm -rf build/model build/spec $(openapi-generator-jar)
	git checkout src/typings src/services || true
	git clean -f -d src/typings src/services || true

.PHONY: check-deps fetch-specs services clean type-check
