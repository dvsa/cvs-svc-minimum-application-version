const fs = require('fs-extra')
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const archiver = require('archiver');
const branchName = require('current-git-branch');

const LAMBDA_NAMES = ['FeatureFlagsLambdaFunction', 'MinAppVersionLambdaFunction'];
const OUTPUT_FOLDER = './'
const REPO_NAME = 'cvs-svc-minimum-application-version';
const BRANCH_NAME = branchName().replace(/\//g, "-");
const COMMIT_HASH = process.env.ZIP_NAME ? process.env.ZIP_NAME : 'local';

class BundlePlugin {
  constructor(params) {
    this.archives = params.archives;
    this.assets = params.assets || [];
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('zip-pack-plugin', async (compilation) => {
      this.archives.forEach(async (archive) => {
        await this.createArchive(archive.inputPath, archive.outputPath, archive.outputName, archive.ignore);
      })

      this.assets.forEach((asset) => {
        fs.copySync(asset.inputPath, asset.outputPath);
      })
    });
  }

  createArchive(inputPath, outputPath, outputName, ignore) {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath)
    };
    const output = fs.createWriteStream(`${outputPath}/${outputName}.zip`);
    const archive = archiver('zip');

    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    archive.on('error', function(err){
        throw err;
    });
    
    archive.pipe(output);
    archive.glob(
      `**/*`, 
      { 
        cwd: inputPath,
        skip: ignore
      }
    );
    return archive.finalize();
  }
};


module.exports = env => {
  let commit = env ? env.commit ? env.commit : 'local' : 'local' ;
  return merge(common, {
    mode: 'production',
    plugins: [
      new BundlePlugin({
        archives: LAMBDA_NAMES.map(ln => {
          return {
            inputPath: `.aws-sam/build/${ln}`,
            outputPath: `${OUTPUT_FOLDER}`,
            outputName: `${COMMIT_HASH}-${ln}`
          }
        })
      }),
    ],
  });
};
